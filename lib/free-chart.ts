import { kstToday } from "./http";
import { UserInputError, type BirthBody } from "./profile-service";
import { calculateChart, type Chart } from "./saju/chart";

/** 무료 풀이 공통: 입력으로 사주를 계산한다. 없는 날짜 같은 입력 문제는 사용자에게 그대로 알린다. */
export function chartFor(b: BirthBody): { chart: Chart; today: { year: number; month: number; day: number } } {
  const today = kstToday();
  try {
    const chart = calculateChart({ calendar: b.calendar, year: b.year, month: b.month, day: b.day, leap: b.leap, hour: b.hour, minute: b.minute, gender: b.gender, options: { referenceYear: today.year } });
    return { chart, today };
  } catch (e) {
    const msg = (e as Error).message ?? "";
    if (/날짜|시각|범위|음력|윤|변환표|지원/.test(msg)) throw new UserInputError(msg);
    throw e;
  }
}