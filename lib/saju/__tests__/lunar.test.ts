import { describe, expect, it } from "vitest";
import reference from "../../../data/saju/reference-kasi.json";
import { julianDayNumber } from "../calendar";
import { leapMonthOf, lunarToSolar, solarToLunar } from "../lunar";

type Ref = { date: string; lunar: { year: number; month: number; day: number; leap: boolean } };
const REF = (reference as Ref[]).filter((r) => r.date >= "1899-02-10" && r.date <= "2050-11-30");

describe("음력 변환 (천문연 대조)", () => {
  it(`양력→음력: 기준 ${REF.length}일 전부 천문연과 같다`, () => {
    expect(REF.length).toBeGreaterThan(700);
    const wrong: string[] = [];
    for (const r of REF) {
      const [y, m, d] = r.date.split("-").map(Number);
      const got = solarToLunar(y, m, d);
      if (got.year !== r.lunar.year || got.month !== r.lunar.month || got.day !== r.lunar.day || got.leap !== r.lunar.leap) {
        wrong.push(`${r.date}: 천문연 ${JSON.stringify(r.lunar)} / 계산 ${JSON.stringify(got)}`);
      }
    }
    expect(wrong).toEqual([]);
  });
  it("음력→양력: 같은 기준일을 되돌리면 원래 양력 날짜", () => {
    const wrong: string[] = [];
    for (const r of REF) {
      const back = lunarToSolar(r.lunar.year, r.lunar.month, r.lunar.day, r.lunar.leap);
      const iso = `${back.year}-${String(back.month).padStart(2, "0")}-${String(back.day).padStart(2, "0")}`;
      if (iso !== r.date) wrong.push(`${r.date} → ${iso}`);
    }
    expect(wrong).toEqual([]);
  });
});

describe("윤달", () => {
  it("2020년은 윤4월: 평달 4월 15일과 윤4월 15일이 다른 날", () => {
    expect(leapMonthOf(2020)).toBe(4);
    expect(lunarToSolar(2020, 4, 15, false)).toEqual({ year: 2020, month: 5, day: 7 });
    expect(lunarToSolar(2020, 4, 15, true)).toEqual({ year: 2020, month: 6, day: 6 });
    expect(solarToLunar(2020, 6, 6)).toEqual({ year: 2020, month: 4, day: 15, leap: true });
  });
  it("윤달이 없는 해에 윤달을 넣으면 오류", () => {
    expect(leapMonthOf(2021)).toBeNull();
    expect(() => lunarToSolar(2021, 4, 1, true)).toThrow();
  });
  it("그 달에 없는 날(예: 29일까지인 달의 30일)은 오류", () => {
    // 1999년 음력 11월은 30일까지(2000-01-01이 11월 25일 → 30일은 2000-01-06)
    expect(lunarToSolar(1999, 11, 30)).toEqual({ year: 2000, month: 1, day: 6 });
    expect(() => lunarToSolar(1999, 11, 31)).toThrow();
    expect(() => lunarToSolar(1999, 11, 0)).toThrow();
  });
});

describe("연속성", () => {
  it("모든 날이 빠짐없이 하루씩 이어진다 (1900-01-01 ~ 2050-11-30, 55,000여 일)", () => {
    // 달력표에 구멍이 있으면 이 검사가 실패한다.
    let prev = solarToLunar(1900, 1, 1);
    const end = julianDayNumber(2050, 11, 30);
    let jdn = julianDayNumber(1900, 1, 1);
    const toDate = (n: number) => new Date((n - 2440588) * 86400000);
    let count = 0;
    while (jdn < end) {
      jdn++;
      const d = toDate(jdn);
      const cur = solarToLunar(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      const sameMonth = cur.year === prev.year && cur.month === prev.month && cur.leap === prev.leap;
      if (sameMonth) {
        expect(cur.day).toBe(prev.day + 1);
      } else {
        expect(cur.day).toBe(1);
        expect(prev.day === 29 || prev.day === 30).toBe(true);
      }
      prev = cur;
      count++;
    }
    expect(count).toBeGreaterThan(55000);
  });
});
