import { BRANCHES, STEMS } from "../ganji";
import type { FourPillars } from "../pillars";
import { BRANCH_ELEMENT, ELEMENT_NAMES, HIDDEN_STEMS, STEM_ELEMENT, controls, generates, mainStemOf, type Element } from "./tables";

export type TenGod = "비견" | "겁재" | "식신" | "상관" | "편재" | "정재" | "편관" | "정관" | "편인" | "정인";

/**
 * 십성: 일간(나)을 기준으로 다른 천간이 어떤 관계인지.
 * 같은 오행이면 비견·겁재, 내가 생하면 식신·상관, 내가 극하면 편재·정재, 나를 극하면 편관·정관, 나를 생하면 편인·정인.
 * 음양이 같으면 앞쪽(비견·식신·편재·편관·편인), 다르면 뒤쪽(겁재·상관·정재·정관·정인).
 */
export function tenGod(dayStem: number, other: number): TenGod {
  const d = STEM_ELEMENT[dayStem];
  const o = STEM_ELEMENT[other];
  const same = dayStem % 2 === other % 2;
  if (d === o) return same ? "비견" : "겁재";
  if (generates(d, o)) return same ? "식신" : "상관";
  if (controls(d, o)) return same ? "편재" : "정재";
  if (controls(o, d)) return same ? "편관" : "정관";
  return same ? "편인" : "정인"; // 상대가 나를 생함
}

export type Position = "연" | "월" | "일" | "시";

export type CharInfo = {
  position: Position;
  /** 천간 */
  stem: { name: string; element: Element; elementName: string; yang: boolean; god: TenGod | null };
  /** 지지 */
  branch: {
    name: string;
    element: Element;
    elementName: string;
    /** 본기 천간 기준 십성(지지의 십성) */
    god: TenGod;
    /** 지장간(여기·중기·본기 순)과 각각의 십성 */
    hidden: { stem: string; element: Element; god: TenGod; main: boolean }[];
  };
};

export type ElementCount = Record<(typeof ELEMENT_NAMES)[number], number>;

export type ElementsAnalysis = {
  dayStem: string;
  dayElement: string;
  characters: CharInfo[];
  /** 겉으로 보이는 글자만: 천간 4 + 지지 4 (시주가 없으면 6) */
  surface: ElementCount;
  /** 지지는 지장간(여기 0.5·중기 1·본기 2 비율은 아래 weights)으로 쪼개 센 값 */
  withHidden: ElementCount;
  /** 십성별 개수(천간 + 지지 본기) */
  godCount: Record<TenGod, number>;
  /** 많은 오행·없는 오행 */
  strongest: string[];
  missing: string[];
};

/** 지장간 가중치: 한 지지를 1로 보고 본기에 큰 비중을 둔다. 지장간이 1개면 1, 2개면 본기 0.7·나머지 0.3, 3개면 본기 0.6·중기 0.25·여기 0.15 */
const HIDDEN_WEIGHTS: Record<number, number[]> = { 1: [1], 2: [0.3, 0.7], 3: [0.15, 0.25, 0.6] };

const emptyCount = (): ElementCount => ({ 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 });
const emptyGods = (): Record<TenGod, number> => ({ 비견: 0, 겁재: 0, 식신: 0, 상관: 0, 편재: 0, 정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0 });
const round2 = (n: number) => Math.round(n * 100) / 100;

export function analyzeElements(p: FourPillars): ElementsAnalysis {
  const dayStem = p.day.stem;
  const list: { position: Position; pillar: NonNullable<FourPillars["hour"]> }[] = [
    { position: "연", pillar: p.year },
    { position: "월", pillar: p.month },
    { position: "일", pillar: p.day },
  ];
  if (p.hour) list.push({ position: "시", pillar: p.hour });

  const surface = emptyCount();
  const withHidden = emptyCount();
  const godCount = emptyGods();

  const characters: CharInfo[] = list.map(({ position, pillar }) => {
    const stemEl = STEM_ELEMENT[pillar.stem];
    const branchEl = BRANCH_ELEMENT[pillar.branch];
    const hiddenList = HIDDEN_STEMS[pillar.branch];
    const weights = HIDDEN_WEIGHTS[hiddenList.length];

    surface[ELEMENT_NAMES[stemEl]] += 1;
    surface[ELEMENT_NAMES[branchEl]] += 1;
    withHidden[ELEMENT_NAMES[stemEl]] += 1;
    hiddenList.forEach((h, i) => (withHidden[ELEMENT_NAMES[STEM_ELEMENT[h]]] += weights[i]));

    const stemGod = position === "일" ? null : tenGod(dayStem, pillar.stem);
    if (stemGod) godCount[stemGod] += 1;
    const branchGod = tenGod(dayStem, mainStemOf(pillar.branch));
    godCount[branchGod] += 1;

    return {
      position,
      stem: { name: STEMS[pillar.stem], element: stemEl, elementName: ELEMENT_NAMES[stemEl], yang: pillar.stem % 2 === 0, god: stemGod },
      branch: {
        name: BRANCHES[pillar.branch],
        element: branchEl,
        elementName: ELEMENT_NAMES[branchEl],
        god: branchGod,
        hidden: hiddenList.map((h, i) => ({
          stem: STEMS[h],
          element: STEM_ELEMENT[h],
          god: tenGod(dayStem, h),
          main: i === hiddenList.length - 1,
        })),
      },
    };
  });

  for (const k of ELEMENT_NAMES) withHidden[k] = round2(withHidden[k]);
  const max = Math.max(...ELEMENT_NAMES.map((k) => withHidden[k]));
  return {
    dayStem: STEMS[dayStem],
    dayElement: ELEMENT_NAMES[STEM_ELEMENT[dayStem]],
    characters,
    surface,
    withHidden,
    godCount,
    strongest: ELEMENT_NAMES.filter((k) => withHidden[k] === max),
    missing: ELEMENT_NAMES.filter((k) => withHidden[k] === 0),
  };
}
