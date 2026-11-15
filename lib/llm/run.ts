import { createHash } from "node:crypto";
import { answerKey, chartHash, defaultStores, usable, type Entry, type KeyValueStore } from "../cache";
import { calculateChart, type Chart, type ChartInput } from "../saju/chart";
import { judge, type Reference } from "../verdict/engine";
import { resolveRecipe } from "../verdict/recipes";
import type { Verdict } from "../verdict/types";
import { PROMPT_VERSION, loadLlmConfig, type LlmConfig } from "./config";
import { guideOfQuestion, type GuideId } from "./guide";
import { buildP1 } from "./prompts/p1-profile";
import { buildP2 } from "./prompts/p2-answer";
import { buildP5 } from "./prompts/p5-review";
import { buildProfileInput } from "./profile-input";
import { makeCaller, type Caller } from "./providers";
import { reviewAnswer, reviewProfile } from "./review";
import { sampleAnswer, sampleProfile } from "./sample";
import { AiReviewSchema, AnswerSchema, ProfileSchema, extractJson, type Answer, type Profile } from "./schemas";

/**
 * AI 문장 생성의 순서 (요구사항 3장, docs/business-plan.md 7장):
 * 판정(코드) → 캐시 확인 → 프로필(P1, 명식당 1회) → 답변(P2) → 코드 검수(P5) → 저장.
 * AI는 판정·확신도·시기를 바꾸지 못한다. 검수에서 떨어지면 한 번 다시 만들고, 또 떨어지면 운영자에게 알리고 환불 대상으로 기록한다.
 */
export type OperatorEvent = { type: "generation-failed" | "ai-review-failed"; questionId?: string; recipeId?: string; problems: string[] };

export class AnswerGenerationError extends Error {
  /** 요구사항 6.8: 답이 만들어지지 않으면 그 질문은 전액 환불 대상이다 */
  readonly refund = true;
  constructor(message: string, readonly problems: string[]) {
    super(message);
  }
}

export type Deps = {
  config?: LlmConfig;
  caller?: Caller;
  profiles?: KeyValueStore<Profile>;
  answers?: KeyValueStore<StoredAnswer>;
  notify?: (e: OperatorEvent) => void | Promise<void>;
  /** AI 검수 표본 비율(기본 5%) */
  aiReviewRate?: number;
};

export type StoredAnswer = { answer: Answer; model?: string; aiReviewed: boolean };

export type AnswerMeta = { source: "cache" | "llm" | "sample"; model?: string; aiReviewed: boolean; promptVersion: string; attempts: number };

export type AnswerOutcome =
  | { status: "needs-partner"; verdict: Verdict }
  | { status: "ok"; answer: Answer; verdict: Verdict; profile: Profile; guide: GuideId; meta: AnswerMeta };

const ATTEMPTS = 2;

/** 운영자 알림(요구사항 3.6). 개인정보 없이 어떤 질문이 왜 실패했는지만 남긴다. 알림 주소가 있으면 거기로도 보낸다. */
export async function notifyOperator(e: OperatorEvent): Promise<void> {
  console.error("[운영자 알림]", JSON.stringify(e));
  const url = process.env.OPERATOR_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: `사주300 ${e.type}: ${e.questionId ?? ""} ${e.problems.slice(0, 3).join(" / ")}` }), signal: AbortSignal.timeout(5000) });
  } catch {
    /* 알림이 실패해도 답변 처리는 계속한다 */
  }
}

/** 호칭은 짧은 글자만 받는다(프롬프트에 사용자가 쓴 글이 섞이지 않게) */
export function safeName(name: string | undefined): string {
  const n = (name ?? "").trim();
  return /^[가-힣A-Za-z0-9 ]{1,8}$/.test(n) ? n : "고객님";
}

/** 표본 추출: 같은 키는 항상 같은 결과 */
export function inSample(key: string, rate: number): boolean {
  if (rate <= 0) return false;
  const n = parseInt(createHash("sha256").update(key).digest("hex").slice(0, 8), 16) / 0xffffffff;
  return n < rate;
}

function resolveDeps(d: Deps) {
  const config = d.config ?? loadLlmConfig();
  const caller = config.mode === "live" ? (d.caller ?? makeCaller(config)) : undefined;
  return {
    config,
    caller,
    profiles: d.profiles ?? (defaultStores.profiles as KeyValueStore<Profile>),
    answers: d.answers ?? (defaultStores.answers as KeyValueStore<StoredAnswer>),
    notify: d.notify ?? notifyOperator,
    aiReviewRate: d.aiReviewRate ?? 0.05,
  };
}

// ───────── P1 프로필 ─────────
export async function getProfile(chart: Chart, deps: Deps = {}): Promise<{ profile: Profile; source: "cache" | "llm" | "sample" }> {
  const r = resolveDeps(deps);
  const live = r.config.mode === "live";
  const key = `profile:${chartHash(chart)}`;
  const hit = await r.profiles.get(key);
  if (usable(hit, PROMPT_VERSION, live)) return { profile: hit.value, source: "cache" };

  const input = buildProfileInput(chart);
  let profile: Profile;
  let source: "llm" | "sample";
  if (!r.caller) {
    profile = sampleProfile(chart);
    source = "sample";
    const check = reviewProfile(profile, input.candidates);
    if (!check.ok) throw new Error(`샘플 프로필이 검수에 떨어졌어요: ${check.problems.join(" / ")}`);
  } else {
    source = "llm";
    profile = await generateChecked<Profile>(r.caller, () => buildP1(input.json), (text) => {
      const parsed = ProfileSchema.safeParse(extractJson(text));
      if (!parsed.success) return { problems: [`JSON 모양이 달라요: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join(", ")}`] };
      const review = reviewProfile(parsed.data, input.candidates);
      return review.ok ? { value: parsed.data } : { problems: review.problems };
    }, r.notify, { type: "generation-failed" });
  }
  await r.profiles.set(key, { value: profile, promptVersion: PROMPT_VERSION, sample: source === "sample", createdAt: new Date().toISOString() } satisfies Entry<Profile>);
  return { profile, source };
}

/** 모델을 부르고, 검사를 통과할 때까지 최대 두 번 만든다. 두 번 다 실패하면 운영자에게 알리고 오류를 던진다. */
async function generateChecked<T>(
  caller: Caller,
  prompt: () => string,
  check: (text: string) => { value: T } | { problems: string[] },
  notify: (e: OperatorEvent) => void | Promise<void>,
  event: { type: OperatorEvent["type"]; questionId?: string; recipeId?: string },
  counter?: { attempts: number },
): Promise<T> {
  const all: string[] = [];
  for (let i = 1; i <= ATTEMPTS; i++) {
    if (counter) counter.attempts = i;
    try {
      const text = await caller(prompt());
      const result = check(text);
      if ("value" in result) return result.value;
      all.push(...result.problems.map((p) => `[${i}회] ${p}`));
    } catch (e) {
      all.push(`[${i}회] ${(e as Error).message}`);
    }
  }
  await notify({ ...event, problems: all });
  throw new AnswerGenerationError("답변을 만들지 못했어요. 결제 금액은 환불돼요.", all);
}

// ───────── P2 답변 ─────────
const stripScores = (value: Verdict["value"]) => JSON.parse(JSON.stringify(value, (k, v) => (k === "scores" ? undefined : v)));

export type AnswerRequest = {
  chartInput: ChartInput;
  questionId: string;
  reference: Reference;
  userName?: string;
};

export async function answerQuestion(req: AnswerRequest, deps: Deps = {}): Promise<AnswerOutcome> {
  const r = resolveDeps(deps);
  const live = r.config.mode === "live";
  const chart = calculateChart(req.chartInput);
  const verdict = judge(chart, req.questionId, req.reference);
  if (verdict.value.kind === "needs-partner") return { status: "needs-partner", verdict };

  const guide = guideOfQuestion(req.questionId);
  const { profile } = await getProfile(chart, deps);
  const key = answerKey(chartHash(chart), req.questionId, req.reference);
  const yearly = verdict.value.kind === "monthly-graph";
  const timeUnknown = chart.lowerConfidence;

  const hit = await r.answers.get(key);
  if (usable(hit, PROMPT_VERSION, live)) {
    // 요구사항 3.8: 같은 키의 답이 있으면 AI를 부르지 않고 저장된 답을 보여 준다
    return { status: "ok", answer: hit.value.answer, verdict, profile, guide, meta: { source: "cache", model: hit.value.model, aiReviewed: hit.value.aiReviewed, promptVersion: PROMPT_VERSION, attempts: 0 } };
  }

  const reviewInput = { guide, verdict, yearly, timeUnknown };
  let answer: Answer;
  let source: "llm" | "sample";
  let aiReviewed = false;
  const counter = { attempts: 0 };

  if (!r.caller) {
    source = "sample";
    answer = sampleAnswer({ verdict, guide, profile, questionId: req.questionId, timeUnknown, yearly });
    counter.attempts = 1;
    const check = reviewAnswer(answer, reviewInput);
    if (!check.ok) throw new Error(`샘플 답변이 검수에 떨어졌어요: ${req.questionId} ${check.problems.join(" / ")}`);
  } else {
    source = "llm";
    const q = resolveRecipe(req.questionId).question;
    const promptInput = {
      guide,
      question: { id: q.id, title: q.title, verdictType: verdict.verdictType },
      verdict: stripScores(verdict.value),
      confidence: verdict.confidence,
      signalsFor: verdict.signalsFor.map(({ label, plain }) => ({ label, plain })),
      signalsAgainst: verdict.signalsAgainst.map(({ label, plain }) => ({ label, plain })),
      profile,
      user: { 호칭: safeName(req.userName), 출생시간: timeUnknown ? "모름" : "있음", 기준날짜: `${req.reference.year}-${String(req.reference.month).padStart(2, "0")}` },
      yearly,
    };
    answer = await generateChecked<Answer>(
      r.caller,
      () => buildP2(promptInput),
      (text) => {
        const parsed = AnswerSchema.safeParse(extractJson(text));
        if (!parsed.success) return { problems: [`JSON 모양이 달라요: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join(", ")}`] };
        const review = reviewAnswer(parsed.data, reviewInput);
        return review.ok ? { value: parsed.data } : { problems: review.problems };
      },
      r.notify,
      { type: "generation-failed", questionId: req.questionId, recipeId: verdict.recipeId },
      counter,
    );

    // P5 AI 검수: 답변의 5%만 표본으로 (요구사항 3.7). 떨어져도 답은 그대로 보여 주고 운영자에게만 알린다.
    if (inSample(key, r.aiReviewRate)) {
      aiReviewed = true;
      try {
        const text = await r.caller(buildP5(answer, { verdict: promptInput.verdict, signals_for: promptInput.signalsFor, signals_against: promptInput.signalsAgainst, profile }));
        const ai = AiReviewSchema.safeParse(extractJson(text));
        if (!ai.success || !ai.data.pass) {
          await r.notify({ type: "ai-review-failed", questionId: req.questionId, recipeId: verdict.recipeId, problems: ai.success ? [...ai.data.invented, ...ai.data.barnum, ...ai.data.fear, ...ai.data.profileConflict] : ["AI 검수 답이 형식에 맞지 않아요"] });
        }
      } catch (e) {
        await r.notify({ type: "ai-review-failed", questionId: req.questionId, recipeId: verdict.recipeId, problems: [(e as Error).message] });
      }
    }
  }

  const model = r.config.mode === "live" ? r.config.model : undefined;
  await r.answers.set(key, { value: { answer, model, aiReviewed }, promptVersion: PROMPT_VERSION, sample: source === "sample", createdAt: new Date().toISOString() });
  return { status: "ok", answer, verdict, profile, guide, meta: { source, model, aiReviewed, promptVersion: PROMPT_VERSION, attempts: counter.attempts } };
}
