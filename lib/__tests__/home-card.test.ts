import { afterEach, describe, expect, it } from "vitest";
import { POST } from "../../app/api/profile/route";
import { voiceProblems } from "../llm/review";
import { sampleProfile } from "../llm/sample";
import { buildProfileCard } from "../profile-card";
import { recommendQuestions } from "../recommend";
import { calculateChart, type ChartInput } from "../saju/chart";
import { addDays } from "../saju/calendar";
import { TODAY_LINES, todayLine } from "../today";
import questions from "../../data/questions.json";

const INPUT: ChartInput = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" };
const chart = calculateChart(INPUT);

describe("삼백이의 오늘 한 마디", () => {
  it("모든 문장이 해치 삼백이의 옛말투 규칙을 통과한다", () => {
    for (const line of TODAY_LINES) expect(voiceProblems("haechi", [line, line, line]), line).toEqual([]);
  });
  it("오늘 일진과 내 일지의 관계로 고른다: 합이면 사람 사이, 충이면 서두르지 말 것", () => {
    // 내 일지는 오(午). 2000-01-01의 일지가 오이므로 같은 일지가 되는 날(12일 간격)과 충인 자일을 찾는다.
    const seen = new Set<string>();
    let combine = 0;
    let clash = 0;
    for (let i = 0; i < 60; i++) {
      const d = addDays(2026, 11, 1, i);
      const r = todayLine(chart, d);
      seen.add(r.line);
      if (r.basis.includes("합")) combine++;
      if (r.basis.includes("충")) clash++;
      expect(r.basis).toContain(r.todayPillar);
    }
    expect(combine).toBeGreaterThan(0);
    expect(clash).toBeGreaterThan(0);
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });
  it("같은 날·같은 사주는 항상 같은 한 줄", () => {
    const a = todayLine(chart, { year: 2026, month: 11, day: 15 });
    const b = todayLine(calculateChart({ ...INPUT }), { year: 2026, month: 11, day: 15 });
    expect(a).toEqual(b);
  });
});

describe("내 사주가 궁금해할 질문 3개", () => {
  const rec = (i: ChartInput, y = 2026) => recommendQuestions(calculateChart(i), y);
  it("서로 다른 주제 3개, 실제 질문, 궁합(C)은 제외, 이유가 있다", () => {
    const r = rec(INPUT);
    expect(r).toHaveLength(3);
    expect(new Set(r.map((x) => x.categoryCode)).size).toBe(3);
    for (const x of r) {
      expect((questions as { id: string }[]).some((q) => q.id === x.questionId)).toBe(true);
      expect(x.categoryCode).not.toBe("C");
      expect(x.reason.length).toBeGreaterThan(5);
      expect(x.price).toBe(300);
      expect(["assi", "doryeong", "haechi"]).toContain(x.guide);
    }
  });
  it("같은 사주·같은 기준 연도면 같은 결과", () => {
    expect(JSON.stringify(rec(INPUT))).toBe(JSON.stringify(rec({ ...INPUT })));
  });
  it("사주가 다르면 추천도 달라진다 (300명 중 서로 다른 조합이 여럿)", () => {
    let seed = 5;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const combos = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const r = rec({ calendar: "solar", year: 1950 + Math.floor(rnd() * 70), month: 1 + Math.floor(rnd() * 12), day: 1 + Math.floor(rnd() * 28), hour: Math.floor(rnd() * 24), minute: 0, gender: rnd() < 0.5 ? "male" : "female" });
      expect(r).toHaveLength(3);
      expect(new Set(r.map((x) => x.categoryCode)).size).toBe(3);
      combos.add(r.map((x) => x.categoryCode).join(""));
    }
    expect(combos.size).toBeGreaterThanOrEqual(6);
  });
  it("도화가 있으면 연애 질문이 위로 온다 (기준 문서 5장)", () => {
    // 기묘 병자 무오 임자: 도화(자)가 있다
    const c = calculateChart(INPUT);
    expect(c.sinsal.hits.some((h) => h.name === "도화")).toBe(true);
    expect(recommendQuestions(c, 2026)[0].categoryCode).toBe("L");
  });
});

describe("프로필 카드", () => {
  it("사주 글자·분석 값만 담고 생년월일·시각은 담지 않는다", () => {
    const card = buildProfileCard(chart, sampleProfile(chart), { year: 2026, month: 11, day: 15 }, 2026);
    const text = JSON.stringify(card);
    expect(card.pillars.map((p) => p.name)).toEqual(["기묘", "병자", "무오", "임자"]);
    expect(card.dayPillar).toBe("무오일주");
    expect(card.pillars[0].stem).toEqual({ ch: "己", element: "earth", label: "토" });
    expect(card.pillars[3].branch).toEqual({ ch: "子", element: "water", label: "수" });
    expect(card.recommendations).toHaveLength(3);
    expect(card.profile.keywords).toHaveLength(3);
    expect(text).not.toMatch(/2000-01-01|"year":2000|"birth/);
    expect(card.timeUnknown).toBe(false);
  });
  it("시간을 모르면 시주가 없고 안내가 붙는다", () => {
    const c = calculateChart({ ...INPUT, hour: null });
    const card = buildProfileCard(c, sampleProfile(c), { year: 2026, month: 11, day: 15 }, 2026);
    expect(card.pillars).toHaveLength(3);
    expect(card.notes.join()).toContain("시주 없이");
    expect(card.timeUnknown).toBe(true);
  });
});

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});
let n = 0;
const call = (b: unknown) => POST(new Request("http://localhost/api/profile", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.1.0.${++n}` }, body: typeof b === "string" ? b : JSON.stringify(b) }));
const body = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" };

describe("POST /api/profile", () => {
  it("키가 없으면 샘플 문장으로 카드를 만든다", async () => {
    delete process.env.LLM_API_KEY;
    const res = await call(body);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const j = await res.json();
    expect(j.status).toBe("ok");
    expect(j.sample).toBe(true);
    expect(j.card.dayPillar).toBe("무오일주");
    expect(j.card.recommendations).toHaveLength(3);
    expect(JSON.stringify(j)).not.toContain("2000-01-01");
  });
  it("같은 사주를 두 번 보내도(두 번째는 캐시) 샘플 문장이라는 표시가 유지된다", async () => {
    delete process.env.LLM_API_KEY;
    const first = await (await call({ ...body, year: 1977, month: 7, day: 7 })).json();
    const second = await (await call({ ...body, year: 1977, month: 7, day: 7 })).json();
    expect(first.sample).toBe(true);
    expect(second.sample).toBe(true);
    expect(JSON.stringify(second.card.profile)).toBe(JSON.stringify(first.card.profile));
  });
  it("음력과 윤달도 받는다", async () => {
    delete process.env.LLM_API_KEY;
    const j = await (await call({ ...body, calendar: "lunar", year: 2020, month: 4, day: 15, leap: true, hour: 12, minute: 0 })).json();
    expect(j.status).toBe("ok");
    const same = await (await call({ ...body, year: 2020, month: 6, day: 6, hour: 12, minute: 0 })).json();
    expect(j.card.pillars.map((p: { name: string }) => p.name)).toEqual(same.card.pillars.map((p: { name: string }) => p.name));
  });
  it("잘못된 입력은 400이고 이유를 알려 준다", async () => {
    delete process.env.LLM_API_KEY;
    expect((await call({ ...body, year: 1800 })).status).toBe(400);
    expect((await call({ ...body, gender: undefined })).status).toBe(400);
    expect((await call("not json")).status).toBe(400);
    const r = await call({ ...body, month: 2, day: 30 });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toContain("날짜");
    const noLeap = await call({ ...body, calendar: "lunar", year: 2021, month: 4, day: 1, leap: true });
    expect(noLeap.status).toBe(400);
  });
  it("AI 설정이 잘못돼도 무료 카드는 막히지 않지만, 설정 오류는 500으로 알린다", async () => {
    process.env.LLM_API_KEY = "secret-key-123";
    delete process.env.LLM_PROVIDER;
    const res = await call(body);
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("secret-key-123");
  });
  it("너무 자주 부르면 429", async () => {
    delete process.env.LLM_API_KEY;
    const h = { "content-type": "application/json", "x-forwarded-for": "8.8.8.8" };
    let last = 200;
    for (let i = 0; i < 32; i++) last = (await POST(new Request("http://localhost/api/profile", { method: "POST", headers: h, body: JSON.stringify(body) }))).status;
    expect(last).toBe(429);
  });
});

