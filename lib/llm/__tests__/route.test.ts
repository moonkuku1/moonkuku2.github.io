import { afterEach, describe, expect, it } from "vitest";
import { POST } from "../../../app/api/answer/route";

const body = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male", questionId: "L04", name: "민준" };
let n = 0;
const call = (b: unknown, headers: Record<string, string> = {}) =>
  POST(new Request("http://localhost/api/answer", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${++n}`, ...headers }, body: typeof b === "string" ? b : JSON.stringify(b) }));

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});

describe("POST /api/answer", () => {
  it("키가 없으면 샘플 문장 모드로 답한다 (판정·근거는 계산값, 응답에 sample 표시)", async () => {
    delete process.env.LLM_API_KEY;
    const res = await call(body);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const j = await res.json();
    expect(j.status).toBe("ok");
    expect(j.sample).toBe(true);
    expect(j.guide).toBe("assi");
    expect(j.answer.headline).toMatch(/월/);
    expect(j.verdict.signalsFor.length).toBeGreaterThan(0);
    expect(JSON.stringify(j)).not.toContain("2000-01-01");
  });
  it("AI 키가 있는데 결제 확인이 안 돼 있으면(PAYMENT_MODE가 test가 아니면) 402", async () => {
    process.env.LLM_API_KEY = "k";
    process.env.LLM_PROVIDER = "openai";
    process.env.LLM_MODEL = "m";
    delete process.env.PAYMENT_MODE;
    const res = await call(body);
    expect(res.status).toBe(402);
  });
  it("AI 설정이 잘못되면 500이고 설정 내용은 노출하지 않는다", async () => {
    process.env.LLM_API_KEY = "secret-key-123";
    delete process.env.LLM_PROVIDER;
    const res = await call(body);
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("secret-key-123");
  });
  it("입력이 잘못되면 400", async () => {
    delete process.env.LLM_API_KEY;
    expect((await call({ ...body, year: 1800 })).status).toBe(400);
    expect((await call({ ...body, questionId: "../etc" })).status).toBe(400);
    expect((await call({ ...body, gender: "x" })).status).toBe(400);
    expect((await call("not json")).status).toBe(400);
    const impossible = await call({ ...body, month: 2, day: 30 });
    expect(impossible.status).toBe(400);
    expect((await impossible.json()).error).toContain("날짜");
  });
  it("궁합 질문은 두 사람 정보가 필요하다고 알린다", async () => {
    delete process.env.LLM_API_KEY;
    const j = await (await call({ ...body, questionId: "C01" })).json();
    expect(j.status).toBe("needs-partner");
  });
  it("같은 사람이 너무 자주 부르면 429", async () => {
    delete process.env.LLM_API_KEY;
    const same = { "x-forwarded-for": "9.9.9.9" };
    let last = 200;
    for (let i = 0; i < 22; i++) last = (await call(body, same)).status;
    expect(last).toBe(429);
  });
  it("출생 시간을 몰라도(hour null) 답하고 확신도 메모가 있다", async () => {
    delete process.env.LLM_API_KEY;
    const j = await (await call({ ...body, hour: null })).json();
    expect(j.status).toBe("ok");
    expect(j.answer.confidenceNote).toContain("출생 시간");
  });
});
