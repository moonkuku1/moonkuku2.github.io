import { spend } from "./budget";
import { MAX_TEMPERATURE, TEMPERATURE, assertServer, type LlmConfig } from "./config";

type Live = Extract<LlmConfig, { mode: "live" }>;

/** 한 번 부르고 모델이 쓴 글(문자열)을 돌려준다. 회사별 차이는 이 파일 안에서만 다룬다. */
export type Caller = (prompt: string) => Promise<string>;

const TIMEOUT_MS = 60_000;
const MAX_TOKENS = 2500;

async function post(url: string, headers: Record<string, string>, body: unknown, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    // 응답 본문에는 키나 개인 정보가 없지만, 길이를 제한해서 기록한다.
    const text = (await res.text()).slice(0, 300);
    throw new Error(`AI 호출 실패 (${res.status}): ${text}`);
  }
  return res.json();
}

export function makeCaller(cfg: Live, opts: { timeoutMs?: number } = {}): Caller {
  assertServer();
  if (TEMPERATURE > MAX_TEMPERATURE) throw new Error("temperature는 0.3 이하여야 해요.");
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  const raw = makeRawCaller(cfg, timeoutMs);
  // 부를 때마다 하루 한도를 센다(넘으면 오류를 던져 AI를 부르지 않는다)
  return async (prompt) => {
    spend();
    return raw(prompt);
  };
}

function makeRawCaller(cfg: Live, timeoutMs: number): Caller {
  if (cfg.provider === "anthropic") {
    return async (prompt) => {
      const r = (await post(
        "https://api.anthropic.com/v1/messages",
        { "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01" },
        { model: cfg.model, max_tokens: MAX_TOKENS, temperature: TEMPERATURE, messages: [{ role: "user", content: prompt }] },
        timeoutMs,
      )) as { content?: { type: string; text?: string }[] };
      const text = r.content?.find((c) => c.type === "text")?.text;
      if (!text) throw new Error("AI 답변이 비어 있어요");
      return text;
    };
  }

  if (cfg.provider === "openai") {
    return async (prompt) => {
      const r = (await post(
        "https://api.openai.com/v1/chat/completions",
        { authorization: `Bearer ${cfg.apiKey}` },
        { model: cfg.model, temperature: TEMPERATURE, max_tokens: MAX_TOKENS, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] },
        timeoutMs,
      )) as { choices?: { message?: { content?: string } }[] };
      const text = r.choices?.[0]?.message?.content;
      if (!text) throw new Error("AI 답변이 비어 있어요");
      return text;
    };
  }

  return async (prompt) => {
    const r = (await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`,
      { "x-goog-api-key": cfg.apiKey },
      { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: TEMPERATURE, maxOutputTokens: MAX_TOKENS, responseMimeType: "application/json" } },
      timeoutMs,
    )) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = r.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) throw new Error("AI 답변이 비어 있어요");
    return text;
  };
}

