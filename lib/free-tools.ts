import { chartFor } from "./free-chart";
import { BRANCH_KO, ELEMENT_TEXT, RELATION_TEXT, STEM_TEXT, ZODIAC, type StemInfo } from "./free-content";
import { pillarsOf, type CardPillar } from "./profile-card";
import type { BirthBody } from "./profile-service";

/**
 * 무료 풀이 3종(오행 분포, 일간, 띠). 계산은 코드가 하고 뜻풀이는 free-content.ts의 고정 문장이다. AI를 쓰지 않는다.
 */

const ELEMENTS = ["목", "화", "토", "금", "수"] as const;

export type FreeOhaeng = {
  pillars: CardPillar[];
  /** 지장간까지 쪼개 센 값(합이 8 안팎) */
  counts: { name: string; value: number; image: string; note: string | null }[];
  strongest: string[];
  missing: string[];
  timeUnknown: boolean;
};

export function makeOhaeng(b: BirthBody): FreeOhaeng {
  const { chart } = chartFor(b);
  const e = chart.elements;
  const counts = ELEMENTS.map((name) => {
    const value = Math.round(e.withHidden[name] * 10) / 10;
    const text = ELEMENT_TEXT[name];
    const note = e.strongest.includes(name) ? text.many : value < 0.5 ? text.few : null;
    return { name, value, image: text.image, note };
  });
  return { pillars: pillarsOf(chart), counts, strongest: e.strongest, missing: e.missing, timeUnknown: chart.notes.includes("time-unknown") };
}

export type FreeIlgan = { pillars: CardPillar[]; stem: string; dayPillar: string; element: string; info: StemInfo; timeUnknown: boolean };

export function makeIlgan(b: BirthBody): FreeIlgan {
  const { chart } = chartFor(b);
  const stem = chart.elements.dayStem;
  const pillars = pillarsOf(chart);
  const day = pillars.find((p) => p.label === "일주")!;
  return { pillars, stem, dayPillar: day.name, element: chart.elements.dayElement, info: STEM_TEXT[stem], timeUnknown: chart.notes.includes("time-unknown") };
}

// 지지 관계표(지지 번호: 자0 축1 인2 묘3 진4 사5 오6 미7 신8 유9 술10 해11)
const pairs = (list: string[]) => list.map((s) => [BRANCH_KO.indexOf(s[0] as (typeof BRANCH_KO)[number]), BRANCH_KO.indexOf(s[1] as (typeof BRANCH_KO)[number])] as [number, number]);
const SIX_COMBINE = pairs(["자축", "인해", "묘술", "진유", "사신", "오미"]);
const CLASH = pairs(["자오", "축미", "인신", "묘유", "진술", "사해"]);
const HARM = pairs(["자미", "축오", "인사", "묘진", "신해", "유술"]);
const WONJIN = pairs(["자유", "축오", "인미", "묘신", "진해", "사술"]);
const BREAK = pairs(["자유", "축진", "인해", "묘오", "사신", "미술"]);
const TRIPLES = [
  [8, 0, 4],
  [11, 3, 7],
  [2, 6, 10],
  [5, 9, 1],
];
const has = (list: [number, number][], a: number, b: number) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** 내 띠 지지(mine)와 올해 지지(target)가 이루는 관계들 */
export function relationKinds(mine: number, target: number): string[] {
  const kinds: string[] = [];
  if (mine === target) kinds.push("본띠");
  if (has(SIX_COMBINE, mine, target)) kinds.push("육합");
  if (mine !== target && TRIPLES.some((t) => t.includes(mine) && t.includes(target))) kinds.push("삼합");
  if (has(CLASH, mine, target)) kinds.push("충");
  if (has(HARM, mine, target)) kinds.push("해");
  if (has(WONJIN, mine, target)) kinds.push("원진");
  if (has(BREAK, mine, target)) kinds.push("파");
  return kinds;
}
export type FreeTti = {
  animal: string;
  branch: string;
  year: number;
  /** 올해 세운 간지 이름(예: 병오) */
  yearPillar: string;
  yearAnimal: string;
  relations: { kind: string; text: string }[];
  samjae: { active: boolean; phase: string | null; years: number[] };
};

export function makeTti(b: BirthBody): FreeTti {
  const { chart, today } = chartFor(b);
  const mine = chart.pillars.year.branch;
  const yearly = chart.yearly!;
  const target = yearly.pillar.branch;
  const kinds = relationKinds(mine, target);
  return {
    animal: ZODIAC[mine],
    branch: BRANCH_KO[mine],
    year: today.year,
    yearPillar: yearly.pillar.name,
    yearAnimal: ZODIAC[target],
    relations: kinds.map((k) => ({ kind: k, text: RELATION_TEXT[k] })),
    samjae: { active: yearly.samjae.active, phase: yearly.samjae.phase, years: yearly.samjae.years },
  };
}
