import { z } from "zod";
import { kstToday } from "./http";
import { loadLlmConfig } from "./llm/config";
import { guideName, type GuideId } from "./llm/guide";
import { makeCaller } from "./llm/providers";
import { answerQuestion, type AnswerMeta, type Deps } from "./llm/run";
import type { Answer } from "./llm/schemas";
import { pillarsOf, type CardPillar } from "./profile-card";
import { BirthBody } from "./profile-service";
import { calculateChart, type Chart } from "./saju/chart";
import { SPECIFIC_RECIPE_IDS } from "./verdict/recipes";
import type { Safety, Verdict } from "./verdict/types";
import questionsJson from "../data/questions.json";
import categoriesJson from "../data/categories.json";

/**
 * 질문 풀이 결과 화면에 필요한 값을 한 번에 만든다(요구사항 4.10).
 * 판정·확신도·시기는 코드가 정하고, 이 파일은 그것을 화면 모양(톤, 달별 흐름, 쓴 글자 표시, 다음 질문)으로 옮길 뿐이다.
 */
export const AnswerBody = BirthBody.extend({
  questionId: z.string().regex(/^[A-Z]\d{2}$/),
  name: z.string().max(20).optional(),
  options: z.object({ lateZiSameDay: z.boolean().optional(), clockMode: z.enum(["dst-only", "utc9"]).optional() }).optional(),
});
export type AnswerBody = z.infer<typeof AnswerBody>;

export type Tone = "good" | "careful";
export type FlowMonth = { label: string; month: number; flow: "good" | "normal" | "careful" };
export type ResultPillar = CardPillar & { usedStem: boolean; usedBranch: boolean };
export type NextQuestion = { questionId: string; title: string; price: number };

export type ResultPayload = {
  questionId: string;
  title: string;
  categoryName: string;
  guide: GuideId;
  guideName: string;
  tone: Tone;
  confidence: "강" | "중" | "약";
  answer: Answer;
  /** 12달 흐름(시기·월 질문일 때) */
  flow: FlowMonth[] | null;
  /** 뽑힌 시기가 좋은 때가 아니라 조심할 때인 질문 */
  risk: boolean;
  pillars: ResultPillar[];
  next: NextQuestion[];
  safety: Safety;
  timeUnknown: boolean;
  sample: boolean;
  meta: AnswerMeta;
};

type Q = { id: string; categoryCode: string; title: string; order: number; price: number; people: number };
const QUESTIONS = questionsJson as unknown as Q[];

/** 판정의 분위기. 해치 포즈(좋으면 손 흔드는 해치, 조심이면 고민하는 해치)와 판정 카드 표시를 정한다. */
export function toneOf(v: Verdict): Tone {
  if (v.risk) return "careful";
  const val = v.value;
  switch (val.kind) {
    case "yesno":
    case "yesno+timing-month":
      return val.answer === "예" ? "good" : "careful";
    case "grade":
    case "score":
      return val.grade === "하" ? "careful" : "good";
    case "timing-month":
    case "timing-year":
      return v.confidenceNet >= 2 ? "good" : "careful";
    case "best-worst-month":
    case "best-worst-year":
      return "good";
    case "monthly-graph":
      return val.yearNet >= 0 ? "good" : "careful";
    case "cause":
      return "careful";
    default:
      return v.confidenceNet >= 0 ? "good" : "careful";
  }
}

/** 12달 막대: 좋은 달은 금색(★), 조심할 달은 붉은색. 점수가 가장 낮은 두 달이 0보다 낮을 때만 조심으로 표시한다. */
export function flowOf(v: Verdict): FlowMonth[] | null {
  const val = v.value;
  const picks = (list: { label: string }[]) => new Set(list.map((m) => m.label));
  let scores: { label: string; month: number; score: number }[] | null = null;
  let good = new Set<string>();
  let bad = new Set<string>();
  switch (val.kind) {
    case "timing-month":
    case "yesno+timing-month":
      scores = val.scores;
      if (v.risk) bad = picks(val.picks);
      else good = picks(val.picks);
      break;
    case "best-worst-month":
      scores = val.scores;
      good = picks(val.best);
      bad = picks(val.worst);
      break;
    case "monthly-graph":
      scores = val.months;
      good = picks(val.best);
      bad = picks(val.worst);
      break;
    default:
      return null;
  }
  const lowest = [...scores].sort((a, b) => a.score - b.score).slice(0, 2).filter((m) => m.score < 0);
  const lowSet = new Set(lowest.map((m) => m.label));
  return scores.map((m) => ({ label: m.label, month: m.month, flow: good.has(m.label) ? "good" : bad.has(m.label) || (!v.risk && lowSet.has(m.label)) ? "careful" : "normal" }));
}

/** 판정에 쓴 글자 표시: 근거 신호가 가리키는 자리(일간·일지·월지·연지)를 금색 테두리로 보여 준다 */
export function usedPositions(v: Verdict): { stem: Set<string>; branch: Set<string> } {
  const stem = new Set<string>(["일주"]); // 십성은 모두 일간 기준이라 일간은 늘 쓰인다
  const branch = new Set<string>();
  for (const s of v.signalsFor) {
    const k = s.key;
    if (/DayBranch|Day$|BranchCombinesDay|BranchClashesDay/.test(k)) branch.add("일주");
    if (/BranchClashesMonth|MonthSupport/.test(k)) branch.add("월주");
    if (/BranchClashesYear/.test(k)) branch.add("연주");
    if (/StemCombine/.test(k)) stem.add("월주");
  }
  return { stem, branch };
}

/** 같은 풀이꾼이 맡은 같은 주제의 다음 질문 3개(정교한 레시피가 있는 질문을 먼저) */
export function nextQuestions(questionId: string, count = 3): NextQuestion[] {
  const cur = QUESTIONS.find((q) => q.id === questionId);
  if (!cur) return [];
  const same = QUESTIONS.filter((q) => q.categoryCode === cur.categoryCode && q.id !== cur.id).sort((a, b) => a.order - b.order);
  const specific = same.filter((q) => SPECIFIC_RECIPE_IDS.includes(q.id));
  const rest = same.filter((q) => !SPECIFIC_RECIPE_IDS.includes(q.id));
  return [...specific, ...rest].slice(0, count).map((q) => ({ questionId: q.id, title: q.title, price: q.price }));
}

export function categoryNameOfQuestion(questionId: string): string {
  const q = QUESTIONS.find((x) => x.id === questionId);
  return (categoriesJson as { code: string; name: string }[]).find((c) => c.code === q?.categoryCode)?.name ?? "";
}

export type MakeResultOutcome = { status: "needs-partner" } | ({ status: "ok" } & ResultPayload);

export async function makeResult(b: AnswerBody, deps: Deps = {}): Promise<MakeResultOutcome> {
  const config = deps.config ?? loadLlmConfig();
  const caller = deps.caller ?? (config.mode === "live" ? makeCaller(config) : undefined);
  const today = kstToday();
  const out = await answerQuestion(
    {
      chartInput: { calendar: b.calendar, year: b.year, month: b.month, day: b.day, leap: b.leap, hour: b.hour, minute: b.minute, gender: b.gender, options: b.options },
      questionId: b.questionId,
      reference: { year: today.year, month: today.month },
      userName: b.name,
    },
    { ...deps, config, caller },
  );
  if (out.status === "needs-partner") return { status: "needs-partner" };

  const chart: Chart = calculateChart({ calendar: b.calendar, year: b.year, month: b.month, day: b.day, leap: b.leap, hour: b.hour, minute: b.minute, gender: b.gender, options: b.options });
  const used = usedPositions(out.verdict);
  const q = QUESTIONS.find((x) => x.id === b.questionId)!;
  return {
    status: "ok",
    questionId: b.questionId,
    title: q.title,
    categoryName: categoryNameOfQuestion(b.questionId),
    guide: out.guide,
    guideName: guideName(out.guide),
    tone: toneOf(out.verdict),
    confidence: out.verdict.confidence,
    answer: out.answer,
    flow: flowOf(out.verdict),
    risk: out.verdict.risk,
    pillars: pillarsOf(chart).map((p) => ({ ...p, usedStem: used.stem.has(p.label), usedBranch: used.branch.has(p.label) })),
    next: nextQuestions(b.questionId),
    safety: out.verdict.safety,
    timeUnknown: chart.lowerConfidence,
    sample: out.meta.source === "sample" || (out.meta.source === "cache" && !out.meta.model),
    meta: out.meta,
  };
}
