import { describe, expect, it } from "vitest";
import questions from "../../../data/questions.json";
import { calculateChart, type ChartInput } from "../../saju/chart";
import { judge } from "../../verdict/engine";
import { guideOfQuestion } from "../guide";
import { buildProfileInput } from "../profile-input";
import { headlineProblems, reviewAnswer, reviewProfile, voiceProblems } from "../review";
import { sampleAnswer, sampleProfile } from "../sample";
import type { Answer } from "../schemas";

const REF = { year: 2026, month: 11 };
const IDS = (questions as { id: string }[]).map((q) => q.id).filter((id) => !id.startsWith("C"));

function charts(): ChartInput[] {
  let seed = 99;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const list: ChartInput[] = [{ calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" }];
  for (let i = 0; i < 9; i++) {
    list.push({
      calendar: "solar",
      year: 1950 + Math.floor(rnd() * 70),
      month: 1 + Math.floor(rnd() * 12),
      day: 1 + Math.floor(rnd() * 28),
      hour: i === 3 ? null : Math.floor(rnd() * 24),
      minute: Math.floor(rnd() * 60),
      gender: i % 2 === 0 ? "male" : "female",
    });
  }
  return list;
}

describe("샘플 문장 모드가 검수(P5 코드 검사)를 통과한다", () => {
  it("프로필(P1): 10개 사주 모두 검수 통과, 키워드 3개, basis는 계산 결과에 있는 것", () => {
    for (const input of charts()) {
      const chart = calculateChart(input);
      const profile = sampleProfile(chart);
      const check = reviewProfile(profile, buildProfileInput(chart).candidates);
      expect(check.problems, JSON.stringify(input)).toEqual([]);
      expect(profile.keywords).toHaveLength(3);
      expect(Array.from(profile.theme).length).toBeLessThanOrEqual(30);
      expect(Array.from(profile.shareLine).length).toBeLessThanOrEqual(20);
    }
  });

  it("답변(P2): 10개 사주 × 질문 210개 이상 모두 통과 (말투·글자 수·근거 칩·판정·금지어)", () => {
    let n = 0;
    const failures: string[] = [];
    for (const input of charts()) {
      const chart = calculateChart(input);
      const profile = sampleProfile(chart);
      for (const id of IDS) {
        const verdict = judge(chart, id, REF);
        if (verdict.value.kind === "needs-partner") continue;
        const guide = guideOfQuestion(id);
        const yearly = verdict.value.kind === "monthly-graph";
        const a = sampleAnswer({ verdict, guide, profile, questionId: id, timeUnknown: chart.lowerConfidence, yearly });
        const r = reviewAnswer(a, { guide, verdict, yearly, timeUnknown: chart.lowerConfidence });
        n++;
        if (!r.ok) failures.push(`${id} ${guide} ${verdict.value.kind} ${verdict.confidence}: ${r.problems.join(" / ")} | ${a.headline}`);
      }
    }
    expect(n).toBeGreaterThan(2000);
    expect(failures.slice(0, 8)).toEqual([]);
  }, 60000);
});

describe("검수 규칙 (요구사항 3.6)", () => {
  const chart = calculateChart({ calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" });
  const profile = sampleProfile(chart);
  const make = (id: string) => {
    const verdict = judge(chart, id, REF);
    const guide = guideOfQuestion(id);
    const yearly = verdict.value.kind === "monthly-graph";
    const answer = sampleAnswer({ verdict, guide, profile, questionId: id, timeUnknown: false, yearly });
    return { verdict, guide, yearly, answer };
  };
  const review = (m: ReturnType<typeof make>, a: Answer) => reviewAnswer(a, { guide: m.guide, verdict: m.verdict, yearly: m.yearly, timeUnknown: false });

  it("기준이 되는 샘플은 통과한다", () => {
    const m = make("L04");
    expect(review(m, m.answer).problems).toEqual([]);
  });
  it("지지 신호에 없는 근거 칩을 쓰면 떨어진다", () => {
    const m = make("L04");
    const bad = { ...m.answer, evidence: [{ chip: "없는 근거", why: "지어낸 근거예요." }, ...m.answer.evidence.slice(1)] };
    expect(review(m, bad).problems.join()).toContain("근거 칩이 지지 신호에 없어요");
  });
  it("headline에 판정 시기가 없으면 떨어진다", () => {
    const m = make("L04");
    expect(review(m, { ...m.answer, headline: "좋은 시기가 곧 올 거예요." }).problems.join()).toContain("headline에 판정 시기");
  });
  it("글자 수가 크게 모자라면 떨어진다", () => {
    const m = make("L04");
    expect(review(m, { ...m.answer, story: "원래 신중한 분이라 차분히 보면 돼요. ".repeat(3) }).problems.join()).toContain("story 글자 수");
  });
  it("금지어·돈·이모지·느낌표", () => {
    const m = make("L04");
    const bad = { ...m.answer, avoid: "돈을 빌려주는 일은 피하세요! 😀" };
    const p = review(m, bad).problems.join();
    expect(p).toContain("‘돈’ 대신 ‘재물’");
    expect(p).toContain("이모지");
    expect(p).toContain("느낌표");
    expect(review(m, { ...m.answer, counter: "지금 확인하지 않으면 후회하게 돼요." }).problems.join()).toContain("쓰지 않는 말");
  });
  it("계산값에 없는 시기를 말하면 떨어진다", () => {
    const m = make("L04");
    const picks = (m.verdict.value as { picks: { month: number }[] }).picks.map((p) => p.month);
    const other = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find((x) => !picks.includes(x))!;
    const bad = { ...m.answer, story: `${m.answer.story} ${other}월에는 반드시 좋은 일이 있어요.` };
    expect(review(m, bad).problems.join()).toContain(`${other}월`);
  });
  it("반대 신호가 없는데 counter가 있거나, 있는데 비면 떨어진다", () => {
    const m = make("L04");
    expect(m.verdict.signalsAgainst.length).toBeGreaterThan(0);
    expect(review(m, { ...m.answer, counter: "" }).problems.join()).toContain("counter가 비었어요");
  });
  it("확신도 메모: 약이면 필수, 아니면 비워 둔다", () => {
    const m = make("L04");
    expect(m.verdict.confidence).toBe("약");
    expect(review(m, { ...m.answer, confidenceNote: "" }).problems.join()).toContain("confidenceNote가 비었어요");
    const strong = make("M01"); // 강
    expect(strong.verdict.confidence).toBe("강");
    expect(review(strong, { ...strong.answer, confidenceNote: "사주만으로 단정하기 어려워요." }).problems.join()).toContain("confidenceNote는");
  });
  it("투자·법률 관련 질문은 전문가 상담 문장이 없으면 떨어진다, 단정 표현도 막는다", () => {
    const m = make("W10");
    expect(m.verdict.safety.consult).toContain("투자");
    const noConsult = { ...m.answer, story: m.answer.story.replace(/전문가 상담[^.]*\./g, "").replace(/전문가[^.]*\./g, ""), action: { ...m.answer.action, do: "이번 달 수입과 지출을 한 번 정리해 적어 보세요." } };
    expect(review(m, noConsult).problems.join()).toContain("전문가 상담");
    expect(review(m, { ...m.answer, story: `${m.answer.story} 이때는 반드시 손해가 나요.` }).problems.join()).toContain("단정");
  });
  it("신년운세는 months 12개가 필요하고 아니면 쓰지 않는다", () => {
    const y = make("Y01");
    expect(y.yearly).toBe(true);
    expect(y.answer.months).toHaveLength(12);
    expect(review(y, y.answer).problems).toEqual([]);
    expect(review(y, { ...y.answer, months: undefined }).problems.join()).toContain("months");
    const plain = make("L04");
    expect(review(plain, { ...plain.answer, months: y.answer.months }).problems.join()).toContain("months를 쓰지 않아요");
  });
});

describe("풀이꾼 말투 검수 (요구사항 4.10-3)", () => {
  const assi = ["5월과 9월이 가장 유력해요.", "새 모임에 나가 보세요.", "마음이 한결 편해질 거예요.", "천천히 해도 괜찮아요."];
  const doryeong = ["올해는 버티는 쪽이 낫습니다.", "큰 결정은 미루시지요.", "성과를 적어 두시지요.", "무리하지 않는 편이 좋습니다."];
  const haechi = ["5월이 으뜸이다.", "8월은 조심하여라.", "서두르지 말거라.", "때가 오면 알게 되느니라."];
  it("각 말투가 자기 규칙은 통과하고 다른 말투는 막힌다", () => {
    expect(voiceProblems("assi", assi)).toEqual([]);
    expect(voiceProblems("doryeong", doryeong)).toEqual([]);
    expect(voiceProblems("haechi", haechi)).toEqual([]);
    expect(voiceProblems("assi", doryeong).length).toBeGreaterThan(0);
    expect(voiceProblems("assi", haechi).length).toBeGreaterThan(0);
    expect(voiceProblems("doryeong", assi).length).toBeGreaterThan(0);
    expect(voiceProblems("haechi", assi).length).toBeGreaterThan(0);
    expect(voiceProblems("haechi", doryeong).length).toBeGreaterThan(0);
  });
  it("headline 판정 말: 예/아니오/조건부/등급", () => {
    const base = judge(calculateChart({ calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" }), "L05", REF);
    const yn = (answer: "예" | "아니오" | "조건부") => ({ ...base, value: { kind: "yesno" as const, answer, net: 0 } });
    expect(headlineProblems(yn("예"), "네, 지금은 흐름이 열려 있어요.")).toEqual([]);
    expect(headlineProblems(yn("아니오"), "지금은 쉬어 가는 쪽이 좋아요.")).toEqual([]);
    expect(headlineProblems(yn("조건부"), "조건이 맞으면 가능해요.")).toEqual([]);
    expect(headlineProblems(yn("조건부"), "별이 빛나는 밤이에요.").length).toBeGreaterThan(0);
  });
});
