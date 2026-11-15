import { z } from "zod";
import { loadLlmConfig } from "../../../lib/llm/config";
import { AnswerGenerationError, answerQuestion } from "../../../lib/llm/run";

/**
 * 질문 답변 API: 계산 → 캐시 확인 → 판정 → AI 문장 → 검수 → 저장 (docs/business-plan.md 7장).
 * 생년월일은 주소가 아니라 요청 본문(POST)으로만 받고, 로그에 남기지 않는다(요구사항 7.3).
 * 결제 확인(요구사항 6.6)은 아직 연결 전이다. 그래서 AI가 실제로 켜져 있을 때는 PAYMENT_MODE=test일 때만 답한다.
 * AI 키가 없는 샘플 문장 모드는 비용이 들지 않아 열려 있다.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  calendar: z.enum(["solar", "lunar"]),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  leap: z.boolean().optional(),
  hour: z.number().int().min(0).max(23).nullable(),
  minute: z.number().int().min(0).max(59).optional(),
  gender: z.enum(["male", "female"]),
  questionId: z.string().regex(/^[A-Z]\d{2}$/),
  name: z.string().max(20).optional(),
  options: z.object({ lateZiSameDay: z.boolean().optional(), clockMode: z.enum(["dst-only", "utc9"]).optional() }).optional(),
});

// 한 서버 안에서만 세는 간단한 횟수 제한(AI 비용 보호). 분당 20번.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 20;
}

/** 한국 시각 기준 현재 연·월(요구사항 3.8의 기준 연월) */
function kstNow() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (limited(ip)) return json({ error: "잠시 후에 다시 시도해 주세요." }, 429);

  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return json({ error: "요청 형식이 맞지 않아요." }, 400);
  }
  if (!parsed.success) return json({ error: "입력값을 확인해 주세요.", fields: parsed.error.issues.map((i) => i.path.join(".")) }, 400);
  const b = parsed.data;

  let config;
  try {
    config = loadLlmConfig();
  } catch (e) {
    console.error("[설정 오류]", (e as Error).message);
    return json({ error: "서버 설정을 확인해 주세요." }, 500);
  }
  if (config.mode === "live" && process.env.PAYMENT_MODE !== "test") {
    return json({ error: "결제 확인이 필요해요." }, 402);
  }

  try {
    const out = await answerQuestion(
      {
        chartInput: {
          calendar: b.calendar,
          year: b.year,
          month: b.month,
          day: b.day,
          leap: b.leap,
          hour: b.hour,
          minute: b.minute,
          gender: b.gender,
          options: b.options,
        },
        questionId: b.questionId,
        reference: kstNow(),
        userName: b.name,
      },
      { config },
    );
    if (out.status === "needs-partner") return json({ status: "needs-partner", message: "궁합은 두 사람의 정보가 필요해요." });
    return json({
      status: "ok",
      sample: out.meta.source === "sample",
      guide: out.guide,
      answer: out.answer,
      verdict: out.verdict,
      profile: out.profile,
      meta: out.meta,
    });
  } catch (e) {
    if (e instanceof AnswerGenerationError) return json({ error: e.message, refund: true }, 502);
    const msg = (e as Error).message ?? "";
    // 입력 검사에서 나온 오류(없는 날짜, 범위 밖 등)는 사용자에게 그대로 알린다
    if (/날짜|시각|범위|음력|윤|없는 질문/.test(msg)) return json({ error: msg }, 400);
    console.error("[답변 오류]", msg.slice(0, 200));
    return json({ error: "답변을 만드는 중 문제가 생겼어요." }, 500);
  }
}
