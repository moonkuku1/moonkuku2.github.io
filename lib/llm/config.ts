/**
 * AI 회사·모델 설정은 이 파일 한 곳에서만 읽는다(요구사항 3.9-1). 키는 서버 환경변수에서만 읽고 브라우저 코드에 들어가지 않는다(3.2).
 * 환경변수: LLM_PROVIDER(anthropic | openai | google), LLM_MODEL, LLM_API_KEY. 키가 없으면 "샘플 문장 모드"(3.9).
 */
export type Provider = "anthropic" | "openai" | "google";

/** temperature는 0~0.3 안에서만 쓴다(요구사항 3.3). */
export const TEMPERATURE = 0.2;
export const MAX_TEMPERATURE = 0.3;

/** 프롬프트나 검수 기준을 바꿀 때 올린다. 캐시 항목이 이 값과 다르면 새로 만든다. */
export const PROMPT_VERSION = "2026-11-15.1";

export type LlmConfig =
  | { mode: "sample" }
  | { mode: "live"; provider: Provider; model: string; apiKey: string };

const PROVIDERS: Provider[] = ["anthropic", "openai", "google"];

export function loadLlmConfig(env: Record<string, string | undefined> = process.env): LlmConfig {
  const apiKey = env.LLM_API_KEY?.trim();
  if (!apiKey) return { mode: "sample" };
  const provider = env.LLM_PROVIDER?.trim() as Provider | undefined;
  const model = env.LLM_MODEL?.trim();
  if (!provider || !PROVIDERS.includes(provider)) throw new Error(`LLM_PROVIDER는 ${PROVIDERS.join(", ")} 중 하나여야 해요.`);
  if (!model) throw new Error("LLM_MODEL을 정해 주세요. (질문당 AI 비용 30원 이하와 한국어 답변 품질을 비교해 고른다)");
  return { mode: "live", provider, model, apiKey };
}

/** AI 호출을 서버에서만 하도록 막는다(요구사항 3.2). 브라우저에서 불리면 오류. */
export function assertServer() {
  if (typeof window !== "undefined") throw new Error("AI는 서버에서만 부를 수 있어요.");
}
