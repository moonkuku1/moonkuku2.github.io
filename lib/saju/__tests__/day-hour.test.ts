import { describe, expect, it } from "vitest";
import { addDays, isValidDate, julianDayNumber } from "../calendar";
import { indexFromName, pillarFromIndex } from "../ganji";
import { dayAndHourPillars, dayPillarOfDate, hourBranchOf, hourPillar } from "../day-hour";

describe("율리우스 일수·날짜", () => {
  it("2000-01-01은 2451545", () => {
    expect(julianDayNumber(2000, 1, 1)).toBe(2451545);
  });
  it("윤년을 구분한다", () => {
    expect(isValidDate(2000, 2, 29)).toBe(true);
    expect(isValidDate(1900, 2, 29)).toBe(false);
    expect(isValidDate(2024, 2, 30)).toBe(false);
    expect(isValidDate(2025, 13, 1)).toBe(false);
  });
  it("날짜를 더한다", () => {
    expect(addDays(2023, 12, 31, 1)).toEqual({ year: 2024, month: 1, day: 1 });
    expect(addDays(2024, 3, 1, -1)).toEqual({ year: 2024, month: 2, day: 29 });
  });
});

describe("일주", () => {
  it("기준일: 1900-01-01 갑술, 2000-01-01 무오", () => {
    expect(dayPillarOfDate(1900, 1, 1).name).toBe("갑술");
    expect(dayPillarOfDate(2000, 1, 1).name).toBe("무오");
  });
  it("하루씩 다음 간지로 넘어가고 60일마다 같은 간지로 돌아온다", () => {
    let prev = dayPillarOfDate(2023, 12, 25).index;
    for (let i = 1; i <= 120; i++) {
      const d = addDays(2023, 12, 25, i);
      const cur = dayPillarOfDate(d.year, d.month, d.day).index;
      expect(cur).toBe((prev + 1) % 60);
      prev = cur;
    }
    expect(dayPillarOfDate(2024, 2, 24).index).toBe(dayPillarOfDate(2023, 12, 26).index);
  });
  it("윤일(2월 29일)과 다음 날이 이어진다", () => {
    const feb29 = dayPillarOfDate(2024, 2, 29).index;
    expect(dayPillarOfDate(2024, 3, 1).index).toBe((feb29 + 1) % 60);
  });
});

describe("간지 표", () => {
  it("60갑자 이름", () => {
    expect(pillarFromIndex(0).name).toBe("갑자");
    expect(pillarFromIndex(59).name).toBe("계해");
    expect(indexFromName("무오(戊午)")).toBe(54);
    expect(() => indexFromName("갑축")).toThrow();
  });
});

describe("시지", () => {
  it("2시간 단위, 23:00부터 자시", () => {
    const cases: [number, number, number][] = [
      [23, 0, 0],
      [0, 59, 0],
      [1, 0, 1],
      [2, 59, 1],
      [3, 0, 2],
      [11, 0, 6],
      [12, 59, 6],
      [13, 0, 7],
      [22, 59, 11],
    ];
    for (const [h, m, b] of cases) expect(hourBranchOf(h, m)).toBe(b);
  });
});

describe("시주 (일간별 자시 천간)", () => {
  it("자시: 갑·기→갑자, 을·경→병자, 병·신→무자, 정·임→경자, 무·계→임자", () => {
    const expected = ["갑자", "병자", "무자", "경자", "임자", "갑자", "병자", "무자", "경자", "임자"];
    for (let stem = 0; stem < 10; stem++) expect(hourPillar(stem, 0).name).toBe(expected[stem]);
  });
  it("일간 갑의 하루: 갑자 을축 병인 정묘 무진 기사 경오 신미 임신 계유 갑술 을해", () => {
    const names = Array.from({ length: 12 }, (_, b) => hourPillar(0, b).name);
    expect(names).toEqual(["갑자", "을축", "병인", "정묘", "무진", "기사", "경오", "신미", "임신", "계유", "갑술", "을해"]);
  });
});

describe("자시와 야자시 (요구사항 1.4)", () => {
  // 2000-01-01은 무오일, 2000-01-02는 기미일.
  it("기본: 23시대는 다음 날 일주, 다음 날 일간의 자시", () => {
    const r = dayAndHourPillars(2000, 1, 1, 23, 30);
    expect(r.day.name).toBe("기미");
    expect(r.hour?.name).toBe("갑자"); // 기(5) → 갑자
    expect(r.dayDate).toEqual({ year: 2000, month: 1, day: 2 });
  });
  it("야자시 옵션: 일주만 당일, 시주는 다음 날 일간의 자시(기본과 같음)", () => {
    const r = dayAndHourPillars(2000, 1, 1, 23, 30, { lateZiSameDay: true });
    expect(r.day.name).toBe("무오");
    expect(r.hour?.name).toBe("갑자"); // 다음 날(기미일) 일간 기 → 갑자
    expect(r.hour?.name).toBe(dayAndHourPillars(2000, 1, 1, 23, 30).hour?.name);
  });
  it("0시대 새벽은 두 방식 모두 당일", () => {
    expect(dayAndHourPillars(2000, 1, 2, 0, 30).day.name).toBe("기미");
    expect(dayAndHourPillars(2000, 1, 2, 0, 30, { lateZiSameDay: true }).day.name).toBe("기미");
  });
  it("22시대(해시)는 당일", () => {
    expect(dayAndHourPillars(2000, 1, 1, 22, 59).day.name).toBe("무오");
  });
  it("시간 모름이면 시주가 없다(요구사항 1.6)", () => {
    const r = dayAndHourPillars(2000, 1, 1, null, 0);
    expect(r.hour).toBeNull();
    expect(r.day.name).toBe("무오");
  });
});
