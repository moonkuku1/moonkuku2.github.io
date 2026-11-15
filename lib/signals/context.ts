import { tenGod, type TenGod } from "../saju/analysis/elements";
import { cheoneulBranchesOf, munchangBranchOf, samjae, twelveSinsal } from "../saju/analysis/sinsal";
import { BRANCH_ELEMENT, ELEMENT_NAMES, STEM_ELEMENT, mainStemOf, type Element } from "../saju/analysis/tables";
import type { LuckPeriod } from "../saju/analysis/luck";
import { monthLuck, yearLuck } from "../saju/analysis/luck";
import type { Chart } from "../saju/chart";
import { STEMS, type Pillar } from "../saju/ganji";

/** 십성 다섯 무리 */
export type Group = "비겁" | "식상" | "재성" | "관성" | "인성";
export const GROUPS: Group[] = ["비겁", "식상", "재성", "관성", "인성"];

export const GROUP_OF_GOD: Record<TenGod, Group> = {
  비견: "비겁",
  겁재: "비겁",
  식신: "식상",
  상관: "식상",
  편재: "재성",
  정재: "재성",
  편관: "관성",
  정관: "관성",
  편인: "인성",
  정인: "인성",
};

/** 한 해·한 달의 간지(세운·월운) */
export type TimePillar = { pillar: Pillar; sajuYear: number };

export type SignalContext = {
  chart: Chart;
  /** 세운으로 볼 사주 연도(입춘 기준) */
  year: number;
  /** 월운 번호(인월=1 … 축월=12). 월 단위 신호를 계산할 때만 */
  month: number | null;
  d: Derived;
};

export type Derived = {
  dayStem: number;
  dayBranch: number;
  yearBranch: number;
  monthBranch: number;
  hourBranch: number | null;
  /** 이 사람이 배우자로 보는 무리: 남자는 재성, 여자는 관성 */
  spouseGroup: Group;
  /** 원국에서 각 무리의 개수(천간 + 지지 본기, 일간 제외) */
  counts: Record<Group, number>;
  helpful: Set<Element>;
  avoid: Set<Element>;
  yearPillar: Pillar;
  monthPillar: Pillar | null;
  period: LuckPeriod | null;
  samjaeActive: boolean;
  /** 12신살 기준(연지·일지)으로 정해지는 지지들 */
  dohwa: Set<number>;
  yeokma: Set<number>;
  hwagae: Set<number>;
  cheoneul: Set<number>;
  munchang: number;
};

const toElement = (name: string): Element => ELEMENT_NAMES.indexOf(name as (typeof ELEMENT_NAMES)[number]) as Element;

/** 일간 기준으로 천간 하나가 어느 무리인지 */
export const groupOfStem = (dayStem: number, stem: number): Group => GROUP_OF_GOD[tenGod(dayStem, stem)];
/** 지지는 본기 천간 기준 */
export const groupOfBranch = (dayStem: number, branch: number): Group => groupOfStem(dayStem, mainStemOf(branch));

/** 두 지지가 서로 충인가 (여섯 칸 건너) */
export const isClash = (a: number, b: number) => (a - b + 12) % 12 === 6;

const SIX_COMBINE = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const TRIPLE_GROUP = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]];
/** 두 지지가 합인가: 육합이거나, 같은 삼합 무리의 서로 다른 글자(반합 포함) */
export const isCombine = (a: number, b: number) =>
  SIX_COMBINE.some(([x, y]) => (x === a && y === b) || (x === b && y === a)) || (a !== b && TRIPLE_GROUP.some((g) => g.includes(a) && g.includes(b)));

/** 사주 연도 y의 세운 간지 */
export const yearPillarOf = (y: number): Pillar => yearLuck(y);

/** 이 사람의 사주 연도 y에서 몇 번째 월운(1~12) 간지 */
export function monthPillarOf(y: number, order: number): Pillar {
  return monthLuck(y)[order - 1].pillar;
}

/** 해당 연도에 걸친 대운(없으면 null: 첫 대운 시작 전) */
function periodAt(chart: Chart, year: number): LuckPeriod | null {
  let found: LuckPeriod | null = null;
  for (const p of chart.majorLuck.periods) if (p.startYear <= year) found = p;
  return found;
}

export function buildContext(chart: Chart, year: number, month: number | null = null): SignalContext {
  const p = chart.pillars;
  const dayStem = p.day.stem;
  const counts = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 } as Record<Group, number>;
  for (const [god, n] of Object.entries(chart.elements.godCount)) counts[GROUP_OF_GOD[god as TenGod]] += n;

  const bases = [p.year.branch, p.day.branch];
  const collect = (key: "연살" | "역마" | "화개") => new Set(bases.map((b) => twelveSinsal(b)[key]));

  const dayStemName = STEMS[dayStem];
  return {
    chart,
    year,
    month,
    d: {
      dayStem,
      dayBranch: p.day.branch,
      yearBranch: p.year.branch,
      monthBranch: p.month.branch,
      hourBranch: p.hour ? p.hour.branch : null,
      spouseGroup: chart.input.gender === "male" ? "재성" : "관성",
      counts,
      helpful: new Set(chart.yongshin.helpful.map((x) => toElement(x.element))),
      avoid: new Set(chart.yongshin.avoid.map((x) => toElement(x.element))),
      yearPillar: yearPillarOf(year),
      monthPillar: month === null ? null : monthPillarOf(year, month),
      period: periodAt(chart, year),
      samjaeActive: samjae(p.year.branch, year).active,
      dohwa: collect("연살"),
      yeokma: collect("역마"),
      hwagae: collect("화개"),
      cheoneul: new Set(cheoneulBranchesOf(dayStemName)),
      munchang: munchangBranchOf(dayStemName),
    },
  };
}

export const elementOfStem = (s: number): Element => STEM_ELEMENT[s] as Element;
export const elementOfBranch = (b: number): Element => BRANCH_ELEMENT[b] as Element;
