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
   * false(기본): 23:00 이후는 일주도 다음 날 것을 쓴다(자시를 한 덩어리로 보고 23시에 날짜를 넘긴다).
   * true: 23:00~23:59는 일주를 당일로 쓴다. 이때 시주는 두 방식 모두 "다음 날 일간 기준의 자시"다.
   * (널리 쓰는 만세력 라이브러리 lunar-javascript와 같은 방식. 테스트로 대조함)
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
  const late = hour !== null && hour >= 23; // 23:00~23:59
  const next = addDays(year, month, day, 1);
  // 일주: 23시대에 날짜를 넘길지는 옵션으로. 시주의 천간은 23시대에 항상 다음 날 일간을 쓴다.
  const dayDate = late && !options.lateZiSameDay ? next : { year, month, day };
  const dayP = dayPillarOfDate(dayDate.year, dayDate.month, dayDate.day);
  if (hour === null) return { day: dayP, hour: null, dayDate };
  const hourDayDate = late ? next : { year, month, day };
  const hourStemBase = late ? dayPillarOfDate(hourDayDate.year, hourDayDate.month, hourDayDate.day) : dayP;
  return { day: dayP, hour: hourPillar(hourStemBase.stem, hourBranchOf(hour, minute)), dayDate };
}

