import { describe, expect, it } from "vitest";
import { calculateChart, type ChartInput } from "../../saju/chart";
import questions from "../../../data/questions.json";
import { confidenceOf, directedNet, judge, yesNo } from "../engine";
import { ALL_QUESTION_IDS, SPECIFIC_RECIPE_IDS, resolveRecipe } from "../recipes";

const INPUT: ChartInput = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" };
const chart = calculateChart(INPUT);
const REF = { year: 2026, month: 11 };
type Q = { id: string; categoryCode: string; answerFormat: string; note: string; title: string };
const Q = questions as unknown as Q[];

describe("확신도 규칙 (요구사항 2.5)", () => {
  it("5 이상 강, 2~4 중, 1 이하 약", () => {
    const table: [number, string][] = [[10, "강"], [5, "강"], [4, "중"], [2, "중"], [1, "약"], [0, "약"], [-3, "약"]];
    for (const [n, c] of table) expect(confidenceOf(n), String(n)).toBe(c);
  });
  it("예/아니오/조건부 경계와 확신도 방향", () => {
    expect(yesNo(3, 3, 0)).toBe("예");
    expect(yesNo(2, 3, 0)).toBe("조건부");
    expect(yesNo(1, 3, 0)).toBe("조건부");
    expect(yesNo(0, 3, 0)).toBe("아니오");
    expect(yesNo(-4, 3, 0)).toBe("아니오");
    expect(directedNet("예", 6)).toBe(6);
    expect(directedNet("아니오", -6)).toBe(6); // 강한 부정도 확신은 강
    expect(directedNet("조건부", 5)).toBe(1); // 애매한 답은 확신을 높이지 않는다
    expect(directedNet("상", 4)).toBe(4);
    expect(directedNet("하", -4)).toBe(4);
  });
});

describe("레시피 (요구사항 2.2, 2.3, 5.5)", () => {
  it("정교한 레시피는 60개 이하이고 모두 실제 질문의 것이다", () => {
    expect(SPECIFIC_RECIPE_IDS.length).toBeGreaterThanOrEqual(10);
    expect(SPECIFIC_RECIPE_IDS.length).toBeLessThanOrEqual(60);
    for (const id of SPECIFIC_RECIPE_IDS) expect(ALL_QUESTION_IDS).toContain(id);
  });
  it("240개 질문 모두 레시피가 있다(질문별이 없으면 카테고리 공통)", () => {
    expect(ALL_QUESTION_IDS).toHaveLength(240);
    for (const id of ALL_QUESTION_IDS) {
      const { recipe } = resolveRecipe(id);
      expect(recipe.verdictType.length).toBeGreaterThan(0);
      expect(["specific", "default"]).toContain(recipe.source);
    }
    expect(resolveRecipe("L04").recipe.source).toBe("specific");
    expect(resolveRecipe("L01").recipe.source).toBe("default");
  });
  it("레시피의 판정 방식이 질문의 답변 형식과 맞다", () => {
    const kindOf = (id: string) => resolveRecipe(id).recipe.rule.kind;
    expect(kindOf("L04")).toBe("timing-month");
    expect(kindOf("M01")).toBe("timing-year");
    expect(kindOf("L10")).toBe("yesno+timing-month");
    expect(kindOf("W04")).toBe("grade");
    expect(kindOf("Y02")).toBe("best-worst-month");
    expect(kindOf("L03")).toBe("cause"); // 원인 질문은 공통 레시피의 원인 판정
    expect(kindOf("L01")).toBe("profile"); // 유형
    expect(kindOf("C01")).toBe("needs-partner"); // 궁합은 두 사람이 필요
  });
});

describe("판정 (요구사항 2.4, 2.8)", () => {
  it("240개 질문 전부 오류 없이 판정이 나온다", () => {
    for (const id of ALL_QUESTION_IDS) {
      const v = judge(chart, id, REF);
      expect(v.questionId).toBe(id);
      expect(["강", "중", "약"]).toContain(v.confidence);
    }
  });
  it("같은 명식·질문·기준 연월이면 항상 같다 (60개 질문 × 2번)", () => {
    for (const id of ALL_QUESTION_IDS.filter((_, i) => i % 4 === 0)) {
      expect(JSON.stringify(judge(chart, id, REF))).toBe(JSON.stringify(judge(calculateChart({ ...INPUT }), id, { ...REF })));
    }
  });
  it("기준 연월이 다르면 시기 판정이 달라질 수 있다", () => {
    const a = judge(chart, "L04", { year: 2026, month: 11 });
    const b = judge(chart, "L04", { year: 2030, month: 3 });
    expect(JSON.stringify(a.value)).not.toBe(JSON.stringify(b.value));
  });

  it("L04(시기·월): 12개월 중 상위 2개, 점수 순서가 맞고 확신도가 점수에서 나온다", () => {
    const v = judge(chart, "L04", REF);
    if (v.value.kind !== "timing-month") throw new Error("kind");
    expect(v.value.scores).toHaveLength(12);
    expect(v.value.scores[0].label).toBe("2026-11"); // 기준 시점의 월운(입동 11월 7일)부터
    expect(v.value.picks).toHaveLength(2);
    const sorted = [...v.value.scores].sort((a, b) => b.score - a.score);
    expect(v.value.picks[0].score).toBe(sorted[0].score);
    expect(v.value.picks[1].score).toBe(sorted[1].score);
    expect(v.value.picks[0].score).toBeGreaterThanOrEqual(v.value.picks[1].score);
    expect(v.confidenceNet).toBe(v.value.picks[0].score);
    // 근거 칩은 고른 달의 점수와 맞는다: (지지 합 − 반대 합) = 점수
    const sum = (l: { weight: number }[]) => l.reduce((n, h) => n + h.weight, 0);
    expect(sum(v.signalsFor) - sum(v.signalsAgainst)).toBe(v.value.picks[0].score);
  });
  it("확신도: 1위와 3위 차가 작으면 한 단계 낮춘다", () => {
    const v = judge(chart, "L04", REF);
    if (v.value.kind !== "timing-month") throw new Error("kind");
    const s = [...v.value.scores].map((x) => x.score).sort((a, b) => b - a);
    const base = confidenceOf(s[0]);
    const levels = ["약", "중", "강"];
    const expectedLowered = v.confidenceNotes.includes("close-gap");
    expect(s[0] - s[2] <= 1).toBe(expectedLowered);
    const idx = levels.indexOf(base) - (expectedLowered ? 1 : 0);
    expect(v.confidence).toBe(levels[Math.max(0, idx)]);
  });
  it("출생 시간을 모르면 확신도가 한 단계 낮아진다 (요구사항 1.6, 2.5)", () => {
    const high = { ...chart, lowerConfidence: false };
    const low = { ...chart, lowerConfidence: true };
    const levels = ["약", "중", "강"];
    let checked = 0;
    for (const id of ALL_QUESTION_IDS.filter((_, i) => i % 3 === 0)) {
      const a = judge(high, id, REF);
      const b = judge(low, id, REF);
      if (a.value.kind === "needs-partner") continue;
      expect(levels.indexOf(b.confidence)).toBe(Math.max(0, levels.indexOf(a.confidence) - 1));
      if (a.confidence !== "약") expect(b.confidenceNotes).toContain("time-unknown");
      checked++;
    }
    expect(checked).toBeGreaterThan(30);
  });

  it("M01(시기·연): 앞으로 7년 중 상위 2년", () => {
    const v = judge(chart, "M01", REF);
    if (v.value.kind !== "timing-year") throw new Error("kind");
    expect(v.value.scores.map((s) => s.year)).toEqual([2026, 2027, 2028, 2029, 2030, 2031, 2032]);
    expect(v.value.picks).toHaveLength(2);
    expect(v.value.picks[0].score).toBe(Math.max(...v.value.scores.map((s) => s.score)));
  });
  it("기준 연월이 1월(입춘 전)이면 세운은 전년 간지를 쓴다", () => {
    const jan = judge(chart, "M01", { year: 2027, month: 1 });
    if (jan.value.kind !== "timing-year") throw new Error("kind");
    expect(jan.value.scores[0].year).toBe(2026);
    const mar = judge(chart, "M01", { year: 2027, month: 3 });
    if (mar.value.kind !== "timing-year") throw new Error("kind");
    expect(mar.value.scores[0].year).toBe(2027);
  });
  it("M07(좋은 해·피할 해): 가장 좋은 해와 가장 조심할 해를 각각 2개", () => {
    const v = judge(chart, "M07", REF);
    if (v.value.kind !== "best-worst-year") throw new Error("kind");
    const scores = v.value.scores.map((s) => s.score);
    expect(v.value.best[0].score).toBe(Math.max(...scores));
    expect(v.value.worst[0].score).toBe(Math.min(...scores));
    expect(v.value.best).toHaveLength(2);
    expect(v.value.worst).toHaveLength(2);
  });
  it("Y02(좋은 달·조심할 달)", () => {
    const v = judge(chart, "Y02", REF);
    if (v.value.kind !== "best-worst-month") throw new Error("kind");
    const scores = v.value.scores.map((s) => s.score);
    expect(v.value.best[0].score).toBe(Math.max(...scores));
    expect(v.value.worst[0].score).toBe(Math.min(...scores));
  });
  it("L05(예/아니오/조건부): 점수에 따라 답이 정해진다", () => {
    const v = judge(chart, "L05", REF);
    if (v.value.kind !== "yesno") throw new Error("kind");
    expect(v.value.answer).toBe(yesNo(v.value.net, 3, 0));
  });
  it("L10(조건부+시기): 답과 시기를 함께 준다", () => {
    const v = judge(chart, "L10", REF);
    if (v.value.kind !== "yesno+timing-month") throw new Error("kind");
    expect(["예", "아니오", "조건부"]).toContain(v.value.answer);
    expect(v.value.picks).toHaveLength(2);
    expect(v.safety.noAssertion).toBe(true);
  });
  it("W04(등급)과 Y03(이번 달 등급)", () => {
    const w = judge(chart, "W04", REF);
    if (w.value.kind !== "grade") throw new Error("kind");
    expect(w.value.grade).toBe(w.value.net >= 4 ? "상" : w.value.net >= 1 ? "중" : "하");
    const y = judge(chart, "Y03", REF);
    if (y.value.kind !== "grade") throw new Error("kind");
    expect(["상", "중", "하"]).toContain(y.value.grade);
  });
  it("Y01(월별 흐름 그래프): 열두 달 점수와 좋은 달·조심할 달", () => {
    const v = judge(chart, "Y01", REF);
    if (v.value.kind !== "monthly-graph") throw new Error("kind");
    expect(v.value.months).toHaveLength(12);
    expect(v.value.best[0].score).toBe(Math.max(...v.value.months.map((m) => m.score)));
    expect(v.value.worst[0].score).toBe(Math.min(...v.value.months.map((m) => m.score)));
  });
  it("원인(L03): 반대 방향 신호 중 가중치가 큰 것부터 최대 3개", () => {
    const v = judge(chart, "L03", REF);
    if (v.value.kind !== "cause") throw new Error("kind");
    expect(v.value.causes.length).toBeLessThanOrEqual(3);
    const w = v.value.causes.map((c) => c.weight);
    expect([...w].sort((a, b) => b - a)).toEqual(w);
  });
  it("유형·서술(profile): 사주 프로필 값을 돌려준다", () => {
    const v = judge(chart, "P02", REF);
    if (v.value.kind !== "profile") throw new Error("kind");
    expect(v.value.strengthLevel).toBe(chart.strength.level);
    expect(v.value.structure).toBe(chart.structure.name);
    expect(v.value.dominantGroup).toBe("재성"); // 재성 3개로 가장 많다
    expect(v.value.helpfulElements).toContain("화");
  });
  it("궁합(C)은 두 사람 정보가 필요하다고 알린다", () => {
    const v = judge(chart, "C01", REF);
    expect(v.value.kind).toBe("needs-partner");
  });
  it("나(P) 카테고리의 시기 질문은 올해 신호를 쓴다", () => {
    const timing = Q.find((q) => q.categoryCode === "P" && q.answerFormat === "시기(연)")!;
    const { recipe } = resolveRecipe(timing.id);
    expect(recipe.signals.some((s) => s.key === "yearHelpfulElement")).toBe(true);
  });
});

describe("안전 장치 (요구사항 3.11)", () => {
  it("노트에 단정 금지가 적힌 질문은 단정 금지", () => {
    const noted = Q.filter((q) => /단정/.test(q.note));
    expect(noted.length).toBeGreaterThan(0);
    for (const q of noted) expect(judge(chart, q.id, REF).safety.noAssertion, q.id).toBe(true);
  });
  it("임신·성별(M25)은 의료 상담을 권한다", () => {
    const v = judge(chart, "M25", REF);
    expect(v.safety.noAssertion).toBe(true);
    expect(v.safety.consult).toContain("의료");
  });
  it("재물 손실 시기(W10)와 보증(W11)은 투자·법률 상담을 권한다", () => {
    expect(judge(chart, "W10", REF).safety.consult).toContain("투자");
    const w11 = judge(chart, "W11", REF);
    expect(w11.safety.consult).toEqual(expect.arrayContaining(["법률", "투자"]));
  });
  it("보통 질문은 단정 금지가 아니다", () => {
    expect(judge(chart, "L01", REF).safety).toEqual({ noAssertion: false, consult: [] });
  });
});

describe("입력 검사", () => {
  it("없는 질문·범위 밖 기준 연월은 오류", () => {
    expect(() => judge(chart, "Z99", REF)).toThrow();
    expect(() => judge(chart, "L04", { year: 2101, month: 1 })).toThrow();
  });
});
