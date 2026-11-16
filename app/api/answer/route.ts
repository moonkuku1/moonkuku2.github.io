import { clientIp, jsonResponse as json, makeLimiter } from "../../../lib/http";
import { loadLlmConfig } from "../../../lib/llm/config";
import { AnswerGenerationError } from "../../../lib/llm/run";
import { AnswerBody, makeResult } from "../../../lib/result-service";

/**
 * 질문 답변 API: 계산 → 캐시 확인 → 판정 → AI 문장 → 검수 → 저장 (docs/business-plan.md 7장).
 * 생년월일은 주소가 아니라 요청 본문(POST)으로만 받고, 로그에 남기지 않는다(요구사항 7.3).
 * 결제 확인(요구사항 6.6)은 아직 연결 전이다. 그래서 AI가 실제로 켜져 있을 때는 PAYMENT_MODE=test일 때만 답한다.
 * AI 키가 없는 샘플 문장 모드는 비용이 들지 않아 열려 있다.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limited = makeLimiter(20);

export async function POST(req: Request) {
  if (limited(clientIp(req))) return json({ error: "잠시 후에 다시 시도해 주세요." }, 429);

  let parsed;
  try {
    parsed = AnswerBody.safeParse(await req.json());
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
    const out = await makeResult(b, { config });
    if (out.status === "needs-partner") return json({ status: "needs-partner", message: "궁합은 두 사람의 정보가 필요해요." });
    return json(out);
  } catch (e) {
    if (e instanceof AnswerGenerationError) return json({ error: e.message, refund: true }, 502);
    const msg = (e as Error).message ?? "";
    // 입력 검사에서 나온 오류(없는 날짜, 범위 밖 등)는 사용자에게 그대로 알린다
    if (/날짜|시각|범위|음력|윤|없는 질문/.test(msg)) return json({ error: msg }, 400);
    console.error("[답변 오류]", msg.slice(0, 200));
    return json({ error: "답변을 만드는 중 문제가 생겼어요." }, 500);
  }
}


