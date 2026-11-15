import { describe, expect, it } from "vitest";
import { calculateChart, type ChartInput } from "../chart";

const base: ChartInput = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" };
const eight = (c: ReturnType<typeof calculateChart>) =>
  [c.pillars.year.name, c.pillars.month.name, c.pillars.day.name, c.pillars.hour?.name ?? "--"].join(" ");

describe("calculateChart", () => {
  it("양력: 2000-01-01 00:30 → 기묘 병자 무오 임자", () => {
    expect(eight(calculateChart(base))).toBe("기묘 병자 무오 임자");
  });
  it("음력으로 넣어도 같은 사람: 음력 1999-11-25 → 양력 2000-01-01", () => {
    const c = calculateChart({ ...base, calendar: "lunar", year: 1999, month: 11, day: 25 });
    expect(c.solarDate).toEqual({ year: 2000, month: 1, day: 1 });
    expect(eight(c)).toBe(eight(calculateChart(base)));
  });
  it("음력 윤달: 2020년 윤4월 15일은 양력 6월 6일", () => {
    const c = calculateChart({ ...base, calendar: "lunar", year: 2020, month: 4, day: 15, leap: true, hour: 12, minute: 0 });
    expect(c.solarDate).toEqual({ year: 2020, month: 6, day: 6 });
  });
  it("시간 모름: 시주가 없고 확신도를 낮춘다", () => {
    const c = calculateChart({ ...base, hour: null });
    expect(c.pillars.hour).toBeNull();
    expect(c.lowerConfidence).toBe(true);
    expect(c.notes).toContain("time-unknown");
    expect(eight(c)).toBe("기묘 병자 무오 --");
  });
  it("시간을 알면 확신도를 낮추지 않는다", () => {
    expect(calculateChart(base).lowerConfidence).toBe(false);
  });
  it("서머타임: 1988-07-01 12:00(서머타임) → 11시(사시)로 계산", () => {
    const c = calculateChart({ ...base, year: 1988, month: 7, day: 1, hour: 12, minute: 0 });
    expect(c.notes).toContain("dst-applied");
    expect(c.clock?.hour).toBe(11);
    expect(c.pillars.hour?.branch).toBe(6); // 11:00은 오시(11:00~12:59)
    const noDst = calculateChart({ ...base, year: 1988, month: 7, day: 1, hour: 13, minute: 0 });
    expect(noDst.pillars.hour?.branch).toBe(6); // 13시 시계 = 12시 표준 → 오시
  });
  it("서머타임으로 날짜가 바뀌는 경우: 1988-07-02 00:30 → 전날 23:30 → 야자시 옵션에 따라", () => {
    const def = calculateChart({ ...base, year: 1988, month: 7, day: 2, hour: 0, minute: 30 });
    // 보정 후 1988-07-01 23:30 → 기본은 다음 날(7월 2일) 일주
    const jul2 = calculateChart({ ...base, year: 1988, month: 7, day: 2, hour: 6, minute: 0 });
    expect(def.pillars.day.name).toBe(jul2.pillars.day.name);
    const late = calculateChart({ ...base, year: 1988, month: 7, day: 2, hour: 0, minute: 30, options: { lateZiSameDay: true } });
    const jul1 = calculateChart({ ...base, year: 1988, month: 7, day: 1, hour: 12, minute: 0 });
    expect(late.pillars.day.name).toBe(jul1.pillars.day.name);
  });
  it("입춘날 시간 모름은 절기 경계 표시", () => {
    const c = calculateChart({ ...base, year: 2024, month: 2, day: 4, hour: null });
    expect(c.notes).toContain("term-boundary");
  });
  it("같은 입력은 항상 같은 결과(JSON이 같다)", () => {
    const a = JSON.stringify(calculateChart(base));
    const b = JSON.stringify(calculateChart({ ...base }));
    expect(a).toBe(b);
  });
  it("없는 양력 날짜·시각은 오류 (시각 보정 단계에서 다음 달로 넘어가지 않는다)", () => {
    expect(() => calculateChart({ ...base, year: 2023, month: 2, day: 29 })).toThrow("없는 날짜");
    expect(() => calculateChart({ ...base, month: 2, day: 30 })).toThrow("없는 날짜");
    expect(() => calculateChart({ ...base, month: 13, day: 1 })).toThrow("없는 날짜");
    expect(() => calculateChart({ ...base, hour: 24 })).toThrow("없는 시각");
    expect(() => calculateChart({ ...base, minute: 60 })).toThrow("없는 시각");
    expect(() => calculateChart({ ...base, hour: null, month: 2, day: 30 })).toThrow("없는 날짜");
  });
  it("없는 음력 날짜는 오류", () => {
    expect(() => calculateChart({ ...base, calendar: "lunar", year: 2021, month: 4, day: 1, leap: true })).toThrow();
  });
});

