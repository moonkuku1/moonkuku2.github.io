import { addDays, julianDayNumber } from "./calendar";
import { type Pillar, pillarFromIndex } from "./ganji";

// 기준일: 1900-01-01은 갑술일(60갑자 10번). 2000-01-01은 무오일로 확인된 값과 맞는다(테스트 참고).
const BASE_JDN = julianDayNumber(1900, 1, 1);
const BASE_INDEX = 10;

/** 그날 0시부터 24시까지의 일주. 자시를 어디서 나누는지는 hourPillar·sajuDay에서 정한다. */
export function dayPillarOfDate(year: number, month: number, day: number): Pillar {
  return pillarFromIndex(BASE_INDEX + (julianDayNumber(year, month, day) - BASE_JDN));
}

/** 시지 번호(0=자시 … 11=해시). 23:00~00:59는 자시. 분은 정각 기준으로 자른다. */
export function hourBranchOf(hour: number, minute: number): number {
  const total = hour * 60 + minute;
  return Math.floor(((total + 60) % 1440) / 120);
}

/** 일간으로 시주를 구한다: 자시의 천간은 일간에 따라 갑·병·무·경·임(일간 갑·기→갑, 을·경→병 …). */
export function hourPillar(dayStem: number, branch: number): Pillar {
  const startStem = (dayStem % 5) * 2; // 갑·기=0(갑), 을·경=2(병), 병·신=4(무), 정·임=6(경), 무·계=8(임)
  return pillarFromIndex(indexOf((startStem + branch) % 10, branch));
}

function indexOf(stem: number, branch: number): number {
  for (let i = stem; i < 60; i += 10) if (i % 12 === branch) return i;
  throw new Error("간지 짝이 맞지 않아요");
}

export type DayHourOptions = {
  /**
   * 야자시 옵션(요구사항 1.4).
   * false(기본): 23:00 이후는 다음 날 일주를 쓴다(자시를 한 덩어리로 보고 날짜를 넘긴다).
   * true: 23:00~23:59도 당일 일주를 쓴다.
   */
  lateZiSameDay?: boolean;
};

/** 양력 날짜·시각으로 일주와 시주를 함께 구한다. 시각은 이미 한국 시각 보정(서머타임 등)이 끝난 값이어야 한다. */
export function dayAndHourPillars(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  minute: number,
  options: DayHourOptions = {},
): { day: Pillar; hour: Pillar | null; dayDate: { year: number; month: number; day: number } } {
  let date = { year, month, day };
  if (hour !== null && hour >= 23 && !options.lateZiSameDay) date = addDays(year, month, day, 1);
  const dayP = dayPillarOfDate(date.year, date.month, date.day);
  const hourP = hour === null ? null : hourPillar(dayP.stem, hourBranchOf(hour, minute));
  return { day: dayP, hour: hourP, dayDate: date };
}
