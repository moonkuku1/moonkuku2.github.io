import { afterEach, describe, expect, it } from "vitest";
import { POST as resultImage } from "../../app/api/share/result/route";
import questions from "../../data/questions.json";
import { MemoryStore } from "../cache";
import { calculateChart, type ChartInput } from "../saju/chart";
import { judge } from "../verdict/engine";
import { RISK_TITLE, resolveRecipe } from "../verdict/recipes";
import { flowOf, makeResult, nextQuestions, toneOf, usedPositions, type AnswerBody } from "../result-service";
import type { Answer, Profile } from "../llm/schemas";
import type { StoredAnswer } from "../llm/run";

const INPUT: ChartInput = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" };
const chart = calculateChart(INPUT);
const REF = { year: 2026, month: 11 };
const BODY: AnswerBody = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male", questionId: "L04" };
const stores = () => ({ profiles: new MemoryStore<Profile>(), answers: new MemoryStore<StoredAnswer>() });
const SAMPLE = { config: { mode: "sample" } as const };

describe("조심할 때를 묻는 질문 (risk)", () => {
  const timing = (questions as { id: string; title: string; answerFormat: string }[]).filter((q) => /시기/.test(q.answerFormat));
  it("제목에 '조심해야 할', '틀어질 수 있는' 같은 말이 있는 시기 질문을 찾는다", () => {
    const ids = timing.filter((q) => RISK_TITLE.test(q.title)).map((q) => q.id).sort();
    expect(ids).toEqual(expect.arrayContaining(["L25", "M16", "W10", "W24", "J20", "F29", "C11"]));
    expect(ids).not.toContain("L04"); // 좋은 때를 묻는 질문은 아니다
    expect(ids).not.toContain("W12"); // "빚이 정리되는 시기"는 좋은 일
  });
  it("공통 레시피는 신호의 방향을 뒤집고 risk로 표시한다", () => {
    const risk = resolveRecipe("L25").recipe;
    const normal = resolveRecipe("L04").recipe;
    expect(risk.risk).toBe(true);
    expect(normal.risk).toBeFalsy();
    const base = resolveRecipe("L21").recipe; // 같은 카테고리의 평범한 시기(월) 질문
    expect(base.risk).toBeFalsy();
    const dirOf = (r: typeof risk, k: string) => r.signals.find((s) => s.key === k)?.dir;
    expect(dirOf(base, "monthSpouseStar")).toBe("+");
    expect(dirOf(risk, "monthSpouseStar")).toBe("-");
    expect(dirOf(base, "monthBranchClashesDay")).toBe("-");
    expect(dirOf(risk, "monthBranchClashesDay")).toBe("+");
  });
  it("W10(재물을 크게 잃을 수 있는 시기)는 이미 뒤집힌 레시피라 방향은 그대로, risk만 표시", () => {
    expect(resolveRecipe("W10").recipe.risk).toBe(true);
    expect(judge(chart, "W10", REF).risk).toBe(true);
    expect(judge(chart, "L25", REF).risk).toBe(true);
    expect(judge(chart, "L04", REF).risk).toBe(false);
  });
  it("risk 판정은 항상 '조심할 흐름'이고, 달별 흐름에서 뽑힌 달은 붉은색", () => {
    const v = judge(chart, "L25", REF);
    expect(toneOf(v)).toBe("careful");
    const flow = flowOf(v)!;
    expect(flow).toHaveLength(12);
    const picks = (v.value as { picks: { label: string }[] }).picks.map((p) => p.label);
    for (const m of flow) expect(m.flow, m.label).toBe(picks.includes(m.label) ? "careful" : "normal");
    expect(flow.some((m) => m.flow === "good")).toBe(false);
  });
});

describe("판정의 분위기와 12달 흐름", () => {
  it("좋은 달은 뽑힌 달, 12개월이 빠짐없이 이어진다", () => {
    const v = judge(chart, "L04", REF);
    const flow = flowOf(v)!;
    expect(flow).toHaveLength(12);
    const picks = (v.value as { picks: { label: string }[] }).picks.map((p) => p.label);
    expect(flow.filter((m) => m.flow === "good").map((m) => m.label)).toEqual(flow.map((m) => m.label).filter((l) => picks.includes(l)));
    expect(flow[0].label).toBe("2026-11");
  });
  it("좋은 달과 조심할 달(Y02)은 각각 최고·최저 점수에서", () => {
    const v = judge(chart, "Y02", REF);
    const flow = flowOf(v)!;
    expect(flow.filter((m) => m.flow === "good")).toHaveLength(2);
    expect(flow.filter((m) => m.flow === "careful").length).toBeGreaterThanOrEqual(2);
  });
  it("연 단위·등급 판정은 달별 흐름이 없다", () => {
    expect(flowOf(judge(chart, "M01", REF))).toBeNull();
    expect(flowOf(judge(chart, "W04", REF))).toBeNull();
  });
  it("톤: 예→좋음, 조건부·아니오→조심, 등급 하→조심", () => {
    const base = judge(chart, "L05", REF);
    const yn = (answer: "예" | "아니오" | "조건부") => ({ ...base, risk: false, value: { kind: "yesno" as const, answer, net: 0 } });
    expect(toneOf(yn("예"))).toBe("good");
    expect(toneOf(yn("조건부"))).toBe("careful");
    expect(toneOf(yn("아니오"))).toBe("careful");
    const g = (grade: "상" | "중" | "하") => ({ ...base, risk: false, value: { kind: "grade" as const, grade, net: 0 } });
    expect(toneOf(g("상"))).toBe("good");
    expect(toneOf(g("중"))).toBe("good");
    expect(toneOf(g("하"))).toBe("careful");
  });
});

describe("쓴 글자 표시와 다음 질문", () => {
  it("일간은 늘 쓰이고, 일지 신호가 있으면 일지도 표시된다", () => {
    const v = judge(chart, "L04", REF);
    const used = usedPositions({ ...v, signalsFor: [{ key: "monthBranchCombinesDay", label: "x", plain: "y", weight: 1, scope: "month" }] });
    expect(used.stem.has("일주")).toBe(true);
    expect(used.branch.has("일주")).toBe(true);
    expect(usedPositions({ ...v, signalsFor: [] }).branch.size).toBe(0);
  });
  it("다음 질문 3개: 같은 주제, 지금 질문은 빼고, 정교한 레시피가 있는 것부터", () => {
    const n = nextQuestions("L04");
    expect(n).toHaveLength(3);
    expect(n.every((x) => x.questionId.startsWith("L") && x.questionId !== "L04")).toBe(true);
    expect(n[0].questionId).toBe("L05");
    expect(nextQuestions("Z99")).toEqual([]);
  });
});

describe("makeResult (샘플 문장 모드)", () => {
  afterEach(() => undefined);
  it("화면에 필요한 값이 모두 있다", async () => {
    const r = await makeResult(BODY, { ...SAMPLE, ...stores() });
    if (r.status !== "ok") throw new Error("status");
    expect(r.guide).toBe("assi");
    expect(r.guideName).toBe("삼백 아씨");
    expect(r.categoryName).toBe("연애");
    expect(r.title).toBe("다음 연애는 언제 시작될까?");
    expect(r.pillars.map((p) => p.name)).toEqual(["기묘", "병자", "무오", "임자"]);
    expect(r.pillars.find((p) => p.label === "일주")!.usedStem).toBe(true);
    expect(r.flow).toHaveLength(12);
    expect(r.next).toHaveLength(3);
    expect(r.sample).toBe(true);
    expect(r.timeUnknown).toBe(false);
    expect(r.answer.evidence.length).toBeGreaterThan(0);
    expect(JSON.stringify(r)).not.toContain("2000-01-01");
  });
  it("같은 질문을 두 번 부르면 같은 결과, 샘플 표시도 유지", async () => {
    const s = stores();
    const a = await makeResult(BODY, { ...SAMPLE, ...s });
    const b = await makeResult({ ...BODY }, { ...SAMPLE, ...s });
    if (a.status !== "ok" || b.status !== "ok") throw new Error("status");
    expect(b.meta.source).toBe("cache");
    expect(b.sample).toBe(true);
    expect(b.answer).toEqual(a.answer);
  });
  it("모든 질문(240개)이 오류 없이 결과를 만든다 (궁합은 두 사람 필요)", async () => {
    const s = stores();
    let ok = 0;
    let partner = 0;
    for (const q of questions as { id: string }[]) {
      const r = await makeResult({ ...BODY, questionId: q.id }, { ...SAMPLE, ...s });
      if (r.status === "ok") {
        ok++;
        expect(r.answer.headline.length).toBeGreaterThan(2);
        expect(["good", "careful"]).toContain(r.tone);
      } else partner++;
    }
    expect(ok).toBe(210);
    expect(partner).toBe(30);
  }, 120000);
  it("출생 시간을 모르면 시주 없이 3칸, 확신도 메모가 있다", async () => {
    const r = await makeResult({ ...BODY, hour: null }, { ...SAMPLE, ...stores() });
    if (r.status !== "ok") throw new Error("status");
    expect(r.pillars).toHaveLength(3);
    expect(r.timeUnknown).toBe(true);
    expect(r.answer.confidenceNote).toContain("출생 시간");
  });
  it("risk 질문(L25)의 샘플 headline은 조심하라고 말한다", async () => {
    const r = await makeResult({ ...BODY, questionId: "L25" }, { ...SAMPLE, ...stores() });
    if (r.status !== "ok") throw new Error("status");
    expect(r.risk).toBe(true);
    expect(r.tone).toBe("careful");
    expect(r.answer.headline).toMatch(/조심/);
    expect(r.answer.headline).not.toMatch(/유력|으뜸|가장 좋/);
  });
});

describe("POST /api/share/result", () => {
  let n = 0;
  const call = (b: unknown) => resultImage(new Request("http://localhost/api/share/result", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `4.4.4.${++n}` }, body: JSON.stringify(b) }));
  it("1080×1920 PNG, 생년월일은 담기지 않는다", async () => {
    delete process.env.LLM_API_KEY;
    const res = await call(BODY);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    const buf = new Uint8Array(await res.arrayBuffer());
    const view = new DataView(buf.buffer);
    expect(view.getUint32(16)).toBe(1080);
    expect(view.getUint32(20)).toBe(1920);
  }, 60000);
  it("잘못된 입력은 400, 궁합은 안내", async () => {
    delete process.env.LLM_API_KEY;
    expect((await call({ ...BODY, month: 2, day: 30 })).status).toBe(400);
    expect((await call({ ...BODY, questionId: "zz" })).status).toBe(400);
    expect((await call({ ...BODY, questionId: "C01" })).status).toBe(400);
  });
});

void ({} as Answer);
