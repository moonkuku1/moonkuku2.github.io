import { describe, expect, it } from "vitest";
import { calculateChart, type ChartInput } from "../../saju/chart";
import { buildContext } from "../context";
import { SIGNALS, SIGNAL_BY_KEY } from "../library";

const MALE_2000: ChartInput = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" };
const chart = calculateChart(MALE_2000); // 기묘 병자 무오 임자, 일간 무(양토)

describe("공통 신호 라이브러리 (요구사항 2.1)", () => {
  it("신호는 40~60개이고 키가 겹치지 않으며 설명이 있다", () => {
    expect(SIGNALS.length).toBeGreaterThanOrEqual(40);
    expect(SIGNALS.length).toBeLessThanOrEqual(60);
    expect(new Set(SIGNALS.map((s) => s.key)).size).toBe(SIGNALS.length);
    for (const s of SIGNALS) {
      expect(s.label.length, s.key).toBeGreaterThan(2);
      expect(s.plain.length, s.key).toBeGreaterThan(10);
      expect(["natal", "year", "month"]).toContain(s.scope);
      expect(SIGNAL_BY_KEY.get(s.key)).toBe(s);
    }
  });
  it("범위 구분: 이름이 natal·year·luck·month로 시작하는 신호의 scope가 맞다", () => {
    for (const s of SIGNALS) {
      if (s.key.startsWith("natal")) expect(s.scope, s.key).toBe("natal");
      else if (s.key.startsWith("month")) expect(s.scope, s.key).toBe("month");
      else expect(s.scope, s.key).toBe("year"); // year·luck
    }
  });

  it("원국 신호(기묘 병자 무오 임자 남자): 재성 3개 → 재성 강함·배우자성 뚜렷, 비겁 1개", () => {
    const ctx = buildContext(chart, 2024);
    const t = (k: string) => SIGNAL_BY_KEY.get(k)!.test(ctx);
    expect(ctx.d.counts).toEqual({ 비겁: 1, 식상: 0, 재성: 3, 관성: 1, 인성: 2 });
    expect(ctx.d.spouseGroup).toBe("재성");
    expect(t("natalWealthStrong")).toBe(true);
    expect(t("natalSpousePresent")).toBe(true);
    expect(t("natalSpouseStrong")).toBe(true);
    expect(t("natalSpouseAbsent")).toBe(false);
    expect(t("natalPeerStrong")).toBe(false);
    expect(t("natalWealthAbsent")).toBe(false);
    expect(t("natalOfficerAbsent")).toBe(false);
    expect(t("natalStrengthWeak")).toBe(true); // 신약
    expect(t("natalDayBranchClashed")).toBe(true); // 자오충
    expect(t("natalClashPresent")).toBe(true);
    expect(t("natalPunishPresent")).toBe(true); // 자묘형
  });
  it("세운 신호(2024 갑진): 갑은 관성, 진은 비겁, 일지 오와 합·충 아님", () => {
    const ctx = buildContext(chart, 2024);
    const t = (k: string) => SIGNAL_BY_KEY.get(k)!.test(ctx);
    expect(t("yearOfficer")).toBe(true);
    expect(t("yearPeer")).toBe(true);
    expect(t("yearWealth")).toBe(false);
    expect(t("yearSpouseStar")).toBe(false);
    expect(t("yearBranchCombinesDay")).toBe(false);
    expect(t("yearBranchClashesDay")).toBe(false);
  });
  it("월운 신호(2024 인월 병인): 병은 인성, 인은 관성, 인오 합", () => {
    const ctx = buildContext(chart, 2024, 1);
    const t = (k: string) => SIGNAL_BY_KEY.get(k)!.test(ctx);
    expect(ctx.d.monthPillar?.name).toBe("병인");
    expect(t("monthPrint")).toBe(true);
    expect(t("monthOfficer")).toBe(true);
    expect(t("monthSpouseStar")).toBe(false);
    expect(t("monthBranchCombinesDay")).toBe(true);
    expect(t("monthBranchClashesDay")).toBe(false);
  });
  it("월 번호가 없으면 월운 신호는 모두 꺼져 있다", () => {
    const ctx = buildContext(chart, 2024, null);
    for (const s of SIGNALS.filter((x) => x.scope === "month")) expect(s.test(ctx), s.key).toBe(false);
  });
  it("배우자성은 성별로 달라진다: 같은 사주도 여자는 관성이 배우자성", () => {
    const female = calculateChart({ ...MALE_2000, gender: "female" });
    const ctx = buildContext(female, 2024);
    expect(ctx.d.spouseGroup).toBe("관성");
    expect(SIGNAL_BY_KEY.get("yearSpouseStar")!.test(ctx)).toBe(true); // 2024 갑 = 관성
    expect(SIGNAL_BY_KEY.get("natalSpouseStrong")!.test(ctx)).toBe(false); // 관성 1개
  });
  it("삼재는 연지 기준: 묘년생은 2025~2027", () => {
    expect(SIGNAL_BY_KEY.get("yearSamjae")!.test(buildContext(chart, 2025))).toBe(true);
    expect(SIGNAL_BY_KEY.get("yearSamjae")!.test(buildContext(chart, 2028))).toBe(false);
  });

  it("무작위 사주 300개 × 신호 전체가 오류 없이 같은 값을 돌려준다(순수 함수)", () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    for (let i = 0; i < 300; i++) {
      const c = calculateChart({
        calendar: "solar",
        year: 1930 + Math.floor(rnd() * 90),
        month: 1 + Math.floor(rnd() * 12),
        day: 1 + Math.floor(rnd() * 28),
        hour: rnd() < 0.15 ? null : Math.floor(rnd() * 24),
        minute: Math.floor(rnd() * 60),
        gender: rnd() < 0.5 ? "male" : "female",
      });
      const year = 2020 + Math.floor(rnd() * 10);
      const month = 1 + Math.floor(rnd() * 12);
      const a = SIGNALS.map((s) => s.test(buildContext(c, year, month)));
      const b = SIGNALS.map((s) => s.test(buildContext(c, year, month)));
      expect(a).toEqual(b);
    }
  });
});
