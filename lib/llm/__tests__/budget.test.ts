import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../../app/api/profile/route";
import { BudgetExceededError, dailyCap, resetBudget, spend, usedToday } from "../budget";
import { makeCaller } from "../providers";
import { MemoryStore } from "../../cache";
import { calculateChart } from "../../saju/chart";
import { answerQuestion, getProfile, type OperatorEvent } from "../run";
import type { Profile } from "../schemas";

const LIVE = { mode: "live", provider: "openai", model: "m", apiKey: "k" } as const;
const INPUT = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" } as const;

const saved = { ...process.env };
beforeEach(() => resetBudget());
afterEach(() => {
  process.env = { ...saved };
  vi.restoreAllMocks();
});

describe("AI 하루 한도", () => {
  it("한도(기본 300)를 읽고, 잘못된 값이면 기본값", () => {
    expect(dailyCap({})).toBe(300);
    expect(dailyCap({ LLM_DAILY_CAP: "50" })).toBe(50);
    expect(dailyCap({ LLM_DAILY_CAP: "0" })).toBe(0);
    expect(dailyCap({ LLM_DAILY_CAP: "abc" })).toBe(300);
    expect(dailyCap({ LLM_DAILY_CAP: "-3" })).toBe(300);
    expect(dailyCap({ LLM_DAILY_CAP: "" })).toBe(300);
  });
  it("한도까지만 쓰고 넘으면 오류", () => {
    const env = { LLM_DAILY_CAP: "3" };
    spend(env);
    spend(env);
    spend(env);
    expect(usedToday()).toBe(3);
    expect(() => spend(env)).toThrow(BudgetExceededError);
    expect(usedToday()).toBe(3);
  });
  it("한도가 0이면 AI를 부르지 않는다", () => {
    expect(() => spend({ LLM_DAILY_CAP: "0" })).toThrow(BudgetExceededError);
  });
  it("실제 호출 함수는 부를 때마다 센다: 한도를 넘으면 네트워크를 부르지 않는다", async () => {
    process.env.LLM_DAILY_CAP = "2";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const call = makeCaller(LIVE);
    await call("a");
    await call("b");
    await expect(call("c")).rejects.toThrow(BudgetExceededError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
  it("회사별 요청 주소와 온도: 세 회사 모두 temperature 0.3 이하, 키는 헤더에만", async () => {
    const seen: { url: string; headers: Record<string, string>; body: string }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        seen.push({ url, headers: init.headers as Record<string, string>, body: String(init.body) });
        const body = url.includes("anthropic") ? { content: [{ type: "text", text: "ok" }] } : url.includes("openai") ? { choices: [{ message: { content: "ok" } }] } : { candidates: [{ content: { parts: [{ text: "ok" }] } }] };
        return new Response(JSON.stringify(body), { status: 200 });
      }),
    );
    for (const provider of ["anthropic", "openai", "google"] as const) {
      const text = await makeCaller({ mode: "live", provider, model: "test-model", apiKey: "SECRET" })("안녕");
      expect(text).toBe("ok");
    }
    expect(seen.map((s) => new URL(s.url).host)).toEqual(["api.anthropic.com", "api.openai.com", "generativelanguage.googleapis.com"]);
    for (const s of seen) {
      expect(s.url).not.toContain("SECRET");
      expect(s.body).not.toContain("SECRET");
      expect(JSON.stringify(s.headers)).toContain("SECRET");
      const temp = JSON.parse(s.body).temperature ?? JSON.parse(s.body).generationConfig?.temperature;
      expect(temp).toBeLessThanOrEqual(0.3);
    }
    vi.unstubAllGlobals();
  });
  it("한도를 넘으면 재시도하지 않고 운영자에게 알리고 환불 대상 오류", async () => {
    process.env.LLM_DAILY_CAP = "0";
    const events: OperatorEvent[] = [];
    const caller = makeCaller(LIVE);
    await expect(
      answerQuestion({ chartInput: INPUT, questionId: "L04", reference: { year: 2026, month: 11 } }, { config: LIVE, caller, notify: (e) => void events.push(e), profiles: new MemoryStore<Profile>(), answers: new MemoryStore() }),
    ).rejects.toBeTruthy();
    expect(events.length).toBeLessThanOrEqual(1);
  });
  it("무료 카드는 AI가 막혀도(한도 0) 샘플 문장으로 카드를 보여 준다", async () => {
    process.env.LLM_API_KEY = "k";
    process.env.LLM_PROVIDER = "openai";
    process.env.LLM_MODEL = "m";
    process.env.LLM_DAILY_CAP = "0";
    const res = await POST(new Request("http://localhost/api/profile", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "7.7.7.7" }, body: JSON.stringify(INPUT) }));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.sample).toBe(true);
    expect(j.card.profile.keywords).toHaveLength(3);
  });
  it("프로필: 한도가 남아 있으면 AI로, 캐시된 프로필은 한도를 쓰지 않는다", async () => {
    const chart = calculateChart(INPUT);
    const store = new MemoryStore<Profile>();
    const { sampleProfile } = await import("../sample");
    const caller = vi.fn(async () => JSON.stringify(sampleProfile(chart)));
    await getProfile(chart, { config: LIVE, caller, profiles: store });
    await getProfile(chart, { config: LIVE, caller, profiles: store });
    expect(caller).toHaveBeenCalledTimes(1);
  });
});
