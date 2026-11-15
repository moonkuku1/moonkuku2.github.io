import { describe, expect, it } from "vitest";
import { correctClock } from "../clock";

const c = (y: number, m: number, d: number, h: number, mi: number, mode?: "dst-only" | "utc9") => correctClock(y, m, d, h, mi, mode);
const hm = (r: ReturnType<typeof c>) => `${r.year}-${String(r.month).padStart(2, "0")}-${String(r.day).padStart(2, "0")} ${String(r.hour).padStart(2, "0")}:${String(r.minute).padStart(2, "0")}`;

describe("서머타임 (요구사항 1.5)", () => {
  it("1988년 여름은 서머타임: 낮 12시 → 11시", () => {
    const r = c(1988, 7, 1, 12, 0);
    expect(r.dst).toBe(true);
    expect(hm(r)).toBe("1988-07-01 11:00");
  });
  it("1988년 겨울·봄은 서머타임이 아니다", () => {
    expect(c(1988, 1, 15, 12, 0).dst).toBe(false);
    expect(hm(c(1988, 1, 15, 12, 0))).toBe("1988-01-15 12:00");
    expect(c(1988, 12, 1, 12, 0).dst).toBe(false);
  });
  it("1987년 서머타임: 5월 10일 02:00 시작, 10월 11일 03:00 끝", () => {
    expect(c(1987, 5, 10, 1, 59).dst).toBe(false);
    expect(c(1987, 5, 10, 3, 0).dst).toBe(true);
    expect(c(1987, 10, 11, 2, 30).dst).toBe(true); // 아직 서머타임(같은 시각이 두 번 중 첫 번째)
    expect(c(1987, 10, 11, 4, 0).dst).toBe(false);
  });
  it("서머타임이 시작하며 건너뛴 시각(1987-05-10 02:30)은 표시한다", () => {
    const r = c(1987, 5, 10, 2, 30);
    expect(r.nonexistent).toBe(true);
  });
  it("서머타임이 끝날 때 두 번 있는 시각(1987-10-11 02:30)은 표시한다", () => {
    const r = c(1987, 10, 11, 2, 30);
    expect(r.ambiguous).toBe(true);
  });
  it("날짜가 넘어가는 경우: 서머타임 중 새벽 0시 30분 → 전날 23시 30분", () => {
    expect(hm(c(1988, 7, 2, 0, 30))).toBe("1988-07-01 23:30");
  });
  it("1950년대 여름에도 서머타임이 있었다(1957년 7월)", () => {
    const r = c(1957, 7, 1, 12, 0);
    expect(r.dst).toBe(true);
    expect(r.offsetMinutes).toBe(570); // UTC+8:30 기준 시계에 서머타임 한 시간
  });
  it("2000년 이후는 서머타임이 없다", () => {
    for (const m of [1, 4, 7, 10]) expect(c(2005, m, 15, 12, 0).shiftMinutes).toBe(0);
  });
});

describe("표준시가 UTC+8:30이던 시기 (1954-03-21 ~ 1961-08-09)", () => {
  it("기본(dst-only)은 시계 시각을 그대로 쓴다", () => {
    const r = c(1957, 1, 15, 12, 0);
    expect(r.offsetMinutes).toBe(510);
    expect(r.dst).toBe(false);
    expect(hm(r)).toBe("1957-01-15 12:00");
  });
  it("utc9 모드는 30분을 더해 UTC+9로 맞춘다", () => {
    expect(hm(c(1957, 1, 15, 12, 0, "utc9"))).toBe("1957-01-15 12:30");
    expect(hm(c(1957, 7, 1, 12, 0, "utc9"))).toBe("1957-07-01 11:30"); // 서머타임 -60분, 표준시 +30분
  });
  it("1961-08-10부터는 다시 UTC+9", () => {
    expect(c(1961, 8, 9, 12, 0).offsetMinutes).toBe(510);
    expect(c(1961, 8, 11, 12, 0).offsetMinutes).toBe(540);
    expect(c(1961, 8, 11, 12, 0, "utc9").shiftMinutes).toBe(0);
  });
  it("1954-03-21 이전(1월)은 UTC+9", () => {
    expect(c(1954, 1, 15, 12, 0).offsetMinutes).toBe(540);
  });
});

describe("보정이 없는 보통 날짜", () => {
  it("2024년·1970년·1930년 낮 12시는 그대로", () => {
    for (const [y, m, d] of [[2024, 6, 1], [1970, 6, 1], [1930, 6, 1]]) {
      const r = c(y, m, d, 12, 0);
      expect(r.shiftMinutes).toBe(0);
      expect(r.dst).toBe(false);
      expect(hm(r)).toBe(`${y}-0${m}-0${d} 12:00`);
    }
  });
  it("1908년 4월 이전은 그대로 쓴다", () => {
    expect(c(1900, 6, 1, 12, 0, "utc9").shiftMinutes).toBe(0);
  });
});
