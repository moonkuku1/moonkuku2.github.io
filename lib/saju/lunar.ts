import monthsJson from "../../data/saju/lunar-months.json";
import { julianDayNumber } from "./calendar";

/**
 * 음력 ↔ 양력 변환 (요구사항 1.2).
 * 한국천문연구원 음양력 정보로 받은 달력표를 쓴다. 각 달의 시작 양력 날짜와 날수가 들어 있고 윤달도 포함돼 있다.
 */
type RawMonth = { y: number; m: number; leap: boolean; start: string; days: number };

type Month = { y: number; m: number; leap: boolean; startJdn: number; days: number };

const months: Month[] = (monthsJson as RawMonth[])
  .map((r) => {
    const [yy, mm, dd] = r.start.split("-").map(Number);
    return { y: r.y, m: r.m, leap: r.leap, startJdn: julianDayNumber(yy, mm, dd), days: r.days };
  })
  .sort((a, b) => a.startJdn - b.startJdn);

export type LunarDate = { year: number; month: number; day: number; leap: boolean };
export type SolarDate = { year: number; month: number; day: number };

/** 이 표가 지원하는 양력 범위 */
export const LUNAR_FIRST = { year: 1899, month: 2, day: 10 };
export const LUNAR_LAST_YEAR = 2050;

function fromJdn(jdn: number): SolarDate {
  // 율리우스 일수 → 양력 (Fliegel & Van Flandern)
  let l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return { year, month, day };
}

export function solarToLunar(year: number, month: number, day: number): LunarDate {
  const jdn = julianDayNumber(year, month, day);
  let lo = 0;
  let hi = months.length - 1;
  if (jdn < months[0].startJdn) throw new Error("음력 변환은 1899년 2월 10일부터 가능해요.");
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (months[mid].startJdn <= jdn) lo = mid;
    else hi = mid - 1;
  }
  const mon = months[lo];
  const offset = jdn - mon.startJdn;
  if (offset >= mon.days) throw new Error("이 날짜는 음력 변환표 범위 밖이에요. (2050년까지 지원)");
  return { year: mon.y, month: mon.m, day: offset + 1, leap: mon.leap };
}

/** 음력 날짜를 양력으로 바꾼다. 윤달이면 leap=true. 없는 날짜(예: 평달에 30일이 없는 달의 30일, 윤달이 없는 해의 윤달)는 오류. */
export function lunarToSolar(year: number, month: number, day: number, leap = false): SolarDate {
  const mon = months.find((x) => x.y === year && x.m === month && x.leap === leap);
  if (!mon) {
    throw new Error(leap ? `${year}년에는 윤${month}월이 없어요.` : `${year}년 ${month}월은 변환표에 없어요. (1899~2050년 지원)`);
  }
  if (!Number.isInteger(day) || day < 1 || day > mon.days) {
    throw new Error(`${year}년 ${leap ? "윤" : ""}${month}월은 ${mon.days}일까지예요.`);
  }
  return fromJdn(mon.startJdn + day - 1);
}

/** 그 해에 윤달이 있으면 윤달의 달 번호, 없으면 null */
export function leapMonthOf(year: number): number | null {
  return months.find((x) => x.y === year && x.leap)?.m ?? null;
}
