import { dayAndHourPillars, type DayHourOptions } from "./day-hour";
import { type Pillar, pillarFromIndex } from "./ganji";
import { findTerm, jeolAround, minutesOf, TABLE_FIRST_YEAR, TABLE_LAST_YEAR } from "./solar-terms";
import { isValidDate } from "./calendar";

export type BirthInput = {
  /** 양력 생년월일. 시각은 이미 한국 시각 보정(서머타임 등)이 끝난 값 */
  year: number;
  month: number;
  day: number;
  /** 출생 시각. 모르면 null */
  hour: number | null;
  minute?: number;
};

export type FourPillars = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  /** 출생 시각을 모르면 null (요구사항 1.6) */
  hour: Pillar | null;
  /** 연주 기준이 되는 해(입춘 이전이면 전년) */
  sajuYear: number;
  timeUnknown: boolean;
  /** 시간을 모르는데 그날 절기가 바뀌어 월주(또는 연주)가 하루 안에서 달라질 수 있음 */
  boundaryAmbiguous: boolean;
};

/** 연간으로 인월(寅月)의 천간을 구한다: 갑·기→병, 을·경→무, 병·신→경, 정·임→임, 무·계→갑 */
function monthStemStart(yearStem: number): number {
  return ((yearStem % 5) * 2 + 2) % 10;
}

function sajuYearAt(instantMinutes: number, calendarYear: number): number {
  const ipchun = findTerm(calendarYear, "입춘").minutes;
  return instantMinutes >= ipchun ? calendarYear : calendarYear - 1;
}

function yearMonthAt(instantMinutes: number, calendarYear: number) {
  const sajuYear = sajuYearAt(instantMinutes, calendarYear);
  const year = pillarFromIndex(sajuYear - 4); // 1984년(갑자)이 기준: (1984-4) % 60 = 0

  // 지난 절기 중 가장 최근 것이 이번 달의 시작이다.
  let current = jeolAround(calendarYear)[0];
  for (const t of jeolAround(calendarYear)) {
    if (t.minutes <= instantMinutes) current = t;
    else break;
  }
  const offset = (current.branch - 2 + 12) % 12; // 인월(2)에서 몇 달째인지
  const stem = (monthStemStart(year.stem) + offset) % 10;
  const branch = current.branch;
  let index = -1;
  for (let i = stem; i < 60; i += 10) if (i % 12 === branch) index = i;
  if (index < 0) throw new Error("월주 간지 짝이 맞지 않아요");
  return { sajuYear, year, month: pillarFromIndex(index) };
}

/** 양력 생년월일시로 연·월·일·시주를 구한다. 연주는 입춘 시각, 월주는 12절 시각 기준이다(요구사항 1.3). */
export function fourPillars(input: BirthInput, options: DayHourOptions = {}): FourPillars {
  const { year, month, day, hour } = input;
  const minute = input.minute ?? 0;
  if (!isValidDate(year, month, day)) throw new Error("없는 날짜예요.");
  if (year < TABLE_FIRST_YEAR || year > TABLE_LAST_YEAR) {
    throw new Error(`${TABLE_FIRST_YEAR}~${TABLE_LAST_YEAR}년 사이만 계산할 수 있어요.`);
  }
  if (hour !== null && (hour < 0 || hour > 23 || minute < 0 || minute > 59)) throw new Error("없는 시각이에요.");

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const timeUnknown = hour === null;
  // 시간을 모르면 정오 기준으로 계산하되, 그날 안에서 월·연이 바뀌는지 따로 확인한다.
  const instant = minutesOf(dateStr, timeUnknown ? "12:00" : `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  const ym = yearMonthAt(instant, year);

  let boundaryAmbiguous = false;
  if (timeUnknown) {
    const start = yearMonthAt(minutesOf(dateStr, "00:00"), year);
    const end = yearMonthAt(minutesOf(dateStr, "23:59"), year);
    boundaryAmbiguous = start.month.index !== end.month.index || start.year.index !== end.year.index;
  }

  const dh = dayAndHourPillars(year, month, day, hour, minute, options);
  return {
    year: ym.year,
    month: ym.month,
    day: dh.day,
    hour: dh.hour,
    sajuYear: ym.sajuYear,
    timeUnknown,
    boundaryAmbiguous,
  };
}
