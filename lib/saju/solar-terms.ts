import kasiJson from "../../data/saju/solar-terms.json";
import calcJson from "../../data/saju/solar-terms-calc.json";

/**
 * 24절기 시각표.
 * - 1920~2028년: 한국천문연구원 "특일 정보" 값(분 단위)
 * - 그 밖의 연도(1899~1919, 2029~2101): 천문 계산값. 같은 방법으로 천문연 값 2,616개와 비교해 최대 1분 차이를 확인했다.
 * 모든 시각은 한국 표준시(KST)다.
 */
type RawTerm = { name: string; lon: number; date: string; time: string };

export type Term = {
  name: string;
  /** 태양 황경(도) */
  lon: number;
  /** 1970-01-01 00:00 KST부터의 분 */
  minutes: number;
  source: "kasi" | "calc";
};

export const KASI_FIRST_YEAR = 1920;
export const KASI_LAST_YEAR = 2028;
export const TABLE_FIRST_YEAR = 1900;
export const TABLE_LAST_YEAR = 2100;

/** 12절(월의 시작이 되는 절기)과 그 달의 지지 번호(자=0). 중기는 월을 바꾸지 않는다. */
export const JEOL: { name: string; branch: number }[] = [
  { name: "소한", branch: 1 }, // 축월
  { name: "입춘", branch: 2 }, // 인월
  { name: "경칩", branch: 3 },
  { name: "청명", branch: 4 },
  { name: "입하", branch: 5 },
  { name: "망종", branch: 6 },
  { name: "소서", branch: 7 },
  { name: "입추", branch: 8 },
  { name: "백로", branch: 9 },
  { name: "한로", branch: 10 },
  { name: "입동", branch: 11 },
  { name: "대설", branch: 0 }, // 자월
];
const JEOL_BRANCH = new Map(JEOL.map((j) => [j.name, j.branch]));

export function minutesOf(date: string, time: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) / 60000;
}

/** KST 분 값을 연·월·일·시·분으로 푼다. */
export function partsOf(minutes: number) {
  const d = new Date(minutes * 60000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

const cache = new Map<number, Term[]>();

/** 한 해의 24절기(시각 순서). 표에 없는 해는 오류. */
export function termsOfYear(year: number): Term[] {
  const hit = cache.get(year);
  if (hit) return hit;
  const kasi = (kasiJson as Record<string, RawTerm[]>)[String(year)];
  const calc = (calcJson as Record<string, RawTerm[]>)[String(year)];
  const raw = kasi ?? calc;
  if (!raw) throw new Error(`${year}년 절기 자료가 없어요. (지원 범위 ${TABLE_FIRST_YEAR}~${TABLE_LAST_YEAR}년)`);
  const terms = raw
    .map((t) => ({ name: t.name, lon: t.lon, minutes: minutesOf(t.date, t.time), source: (kasi ? "kasi" : "calc") as Term["source"] }))
    .sort((a, b) => a.minutes - b.minutes);
  cache.set(year, terms);
  return terms;
}

export function findTerm(year: number, name: string): Term {
  const t = termsOfYear(year).find((x) => x.name === name);
  if (!t) throw new Error(`${year}년 ${name} 절기가 없어요.`);
  return t;
}

/** 연도 앞뒤 한 해씩 포함한 12절 목록(시각 순서). 월주를 구할 때 쓴다. */
export function jeolAround(year: number): (Term & { branch: number })[] {
  const out: (Term & { branch: number })[] = [];
  for (const y of [year - 1, year, year + 1]) {
    if (y < TABLE_FIRST_YEAR - 1 || y > TABLE_LAST_YEAR + 1) continue;
    for (const t of termsOfYear(y)) {
      const branch = JEOL_BRANCH.get(t.name);
      if (branch !== undefined) out.push({ ...t, branch });
    }
  }
  return out.sort((a, b) => a.minutes - b.minutes);
}
