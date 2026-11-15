import { pillarFromIndex, type Pillar } from "../ganji";
import type { FourPillars } from "../pillars";
import { findTerm, jeolAround, partsOf, TABLE_FIRST_YEAR, TABLE_LAST_YEAR } from "../solar-terms";

/**
 * 대운·세운·월운 (요구사항 1.7).
 * - 대운 방향: 양간 해의 남자·음간 해의 여자는 순행, 반대는 역행 (연주 천간의 음양 기준).
 * - 대운 시작: 순행은 태어난 뒤 처음 오는 절기(12절)까지, 역행은 태어나기 직전 절기까지의 시간을 3일 = 1년으로 바꾼다.
 *   (1일 = 4개월, 1시간 = 5일)
 */
export type Gender = "male" | "female";

export type LuckPeriod = {
  /** 몇 번째 대운(1부터) */
  order: number;
  pillar: Pillar;
  /** 이 대운이 시작하는 만 나이(소수 포함 연 단위) */
  startAge: number;
  endAge: number;
  /** 이 대운이 시작하는 양력 연도 */
  startYear: number;
};

export type MajorLuck = {
  direction: "순행" | "역행";
  /** 시작 나이: 몇 년 몇 개월 몇 일 */
  start: { years: number; months: number; days: number };
  /** 시작 나이를 연 단위 소수로 나타낸 값 */
  startAgeYears: number;
  /** 기준이 된 절기 이름과 시각(KST) */
  basis: { name: string; date: string; time: string; days: number };
  periods: LuckPeriod[];
};

const MINUTES_PER_DAY = 1440;

/** 출생 시각(KST 분)과 방향으로 대운을 만든다. count는 대운 개수(기본 10개 = 100년) */
export function majorLuck(p: FourPillars, gender: Gender, birthMinutes: number, birthYear: number, count = 10): MajorLuck {
  const yearYang = p.year.stem % 2 === 0;
  const forward = (yearYang && gender === "male") || (!yearYang && gender === "female");

  const jeol = jeolAround(partsOf(birthMinutes).year);
  let basis = jeol[0];
  if (forward) {
    basis = jeol.find((t) => t.minutes > birthMinutes) ?? jeol[jeol.length - 1];
  } else {
    for (const t of jeol) if (t.minutes <= birthMinutes) basis = t;
  }

  const diffDays = Math.abs(basis.minutes - birthMinutes) / MINUTES_PER_DAY;
  const startAgeYears = diffDays / 3;
  // 3일 = 1년, 1일 = 4개월, 1시간 = 5일
  let months = Math.floor(startAgeYears * 12 + 1e-9);
  const years = Math.floor(months / 12);
  months -= years * 12;
  const restDays = Math.round((startAgeYears * 12 - Math.floor(startAgeYears * 12 + 1e-9)) * 30);

  const step = forward ? 1 : -1;
  const periods: LuckPeriod[] = Array.from({ length: count }, (_, i) => {
    const startAge = startAgeYears + i * 10;
    return {
      order: i + 1,
      pillar: pillarFromIndex(p.month.index + step * (i + 1)),
      startAge: Math.round(startAge * 100) / 100,
      endAge: Math.round((startAge + 10) * 100) / 100,
      startYear: Math.floor(birthYear + startAge),
    };
  });

  const bp = partsOf(basis.minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    direction: forward ? "순행" : "역행",
    start: { years, months, days: restDays },
    startAgeYears: Math.round(startAgeYears * 1000) / 1000,
    basis: { name: basis.name, date: `${bp.year}-${pad(bp.month)}-${pad(bp.day)}`, time: `${pad(bp.hour)}:${pad(bp.minute)}`, days: Math.round(diffDays * 100) / 100 },
    periods,
  };
}

/** 세운: 그 해의 간지. 해가 바뀌는 기준은 입춘이므로 연도 숫자 그대로 쓴다(1984=갑자). */
export function yearLuck(year: number): Pillar {
  return pillarFromIndex(year - 4);
}

export type MonthLuck = {
  /** 몇 번째 달(인월=1 … 축월=12) */
  order: number;
  pillar: Pillar;
  /** 이 달이 시작하는 절기와 시각 */
  term: string;
  date: string;
  time: string;
};

/** 월운: 그 사주 연도(입춘~다음 입춘 전)의 열두 달 간지 */
export function monthLuck(year: number): MonthLuck[] {
  if (year < TABLE_FIRST_YEAR || year > TABLE_LAST_YEAR) throw new Error(`${TABLE_FIRST_YEAR}~${TABLE_LAST_YEAR}년만 계산할 수 있어요.`);
  const ipchun = findTerm(year, "입춘").minutes;
  const nextIpchun = findTerm(year + 1, "입춘").minutes;
  const starts = jeolAround(year).filter((t) => t.minutes >= ipchun && t.minutes < nextIpchun);
  const yearStem = yearLuck(year).stem;
  const startStem = ((yearStem % 5) * 2 + 2) % 10;
  const pad = (n: number) => String(n).padStart(2, "0");
  return starts.map((t, i) => {
    const stem = (startStem + i) % 10;
    const branch = t.branch;
    let index = -1;
    for (let k = stem; k < 60; k += 10) if (k % 12 === branch) index = k;
    const d = partsOf(t.minutes);
    return { order: i + 1, pillar: pillarFromIndex(index), term: t.name, date: `${d.year}-${pad(d.month)}-${pad(d.day)}`, time: `${pad(d.hour)}:${pad(d.minute)}` };
  });
}

