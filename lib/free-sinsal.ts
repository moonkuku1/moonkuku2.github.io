import { chartFor } from "./free-chart";
import type { BirthBody } from "./profile-service";
import { pillarsOf, type CardPillar } from "./profile-card";

/**
 * 무료 신살 조회. 사주 안에 있는 신살을 코드가 찾고, 뜻은 정해진 문장으로 보여 준다(AI를 쓰지 않는다).
 * 신살은 "있다/없다"를 알려 주는 것이고, 좋고 나쁨을 단정하거나 겁을 주지 않는다.
 */
export type SinsalMeaning = { name: string; summary: string; tip: string };

/** 신살 뜻풀이(해치 삼백이의 옛말투). 근거 없는 단정과 겁주는 말은 쓰지 않는다. */
export const SINSAL_MEANING: Record<string, SinsalMeaning> = {
  도화: { name: "도화", summary: "사람을 끄는 매력과 인기의 기운이다.", tip: "표현이 풍부해지는 때에 좋은 인연을 만들기 쉽다." },
  홍염살: { name: "홍염살", summary: "이성에게 호감을 주는 끌림의 기운이다.", tip: "말씨와 태도를 다듬을수록 장점으로 쓰인다." },
  화개: { name: "화개", summary: "혼자 깊이 파고드는 몰입과 예술·학문의 기운이다.", tip: "혼자만의 시간을 갖되, 사람과의 연결도 놓지 말아라." },
  역마: { name: "역마", summary: "움직임과 이동, 변화가 많은 기운이다.", tip: "이사·여행·이직처럼 자리를 옮기는 일과 인연이 있다." },
  천을귀인: { name: "천을귀인", summary: "어려울 때 도움을 주는 사람을 만나기 쉬운 기운이다.", tip: "막힐 때 주변에 먼저 물어보면 길이 열린다." },
  문창귀인: { name: "문창귀인", summary: "글과 공부, 시험에 힘을 받는 기운이다.", tip: "읽고 쓰는 일에서 실력을 드러내기 좋다." },
  백호대살: { name: "백호대살", summary: "강한 추진력과 결단의 기운이다.", tip: "급하게 몰아붙이지 말고, 한 박자 쉬어 가면 힘이 된다." },
  괴강살: { name: "괴강살", summary: "강단과 카리스마가 있는 기운이다.", tip: "고집이 세게 보이지 않도록 먼저 듣는 연습이 도움이 된다." },
  귀문관살: { name: "귀문관살", summary: "예민한 직관과 생각이 많은 기운이다.", tip: "생각이 길어질 땐 몸을 움직이거나 글로 적어 보아라." },
};

export type FreeSinsal = {
  pillars: CardPillar[];
  found: { name: string; summary: string; tip: string; where: string[] }[];
  /** 이 사주에는 없는 신살(조회 대상 중) */
  absent: string[];
  samjae: { year: number; active: boolean; phase: string | null; years: number[] };
  timeUnknown: boolean;
};

const ORDER = ["천을귀인", "문창귀인", "도화", "홍염살", "화개", "역마", "백호대살", "괴강살", "귀문관살"];

export function makeSinsal(b: BirthBody): FreeSinsal {
  const { chart, today } = chartFor(b);
  // 같은 이름이 기준을 달리해 여러 번 나올 수 있어(예: 연지 기준·일지 기준 도화) 자리를 합친다
  const byName = new Map<string, Set<string>>();
  for (const h of chart.sinsal.hits) {
    const set = byName.get(h.name) ?? new Set<string>();
    for (const p of h.places) set.add(`${p}(${h.chars})`);
    byName.set(h.name, set);
  }
  const found = ORDER.filter((n) => byName.has(n)).map((n) => ({ ...SINSAL_MEANING[n], where: [...byName.get(n)!] }));
  const absent = ORDER.filter((n) => !byName.has(n));
  const y = chart.yearly!.samjae;
  return {
    pillars: pillarsOf(chart),
    found,
    absent,
    samjae: { year: today.year, active: y.active, phase: y.phase, years: y.years },
    timeUnknown: chart.notes.includes("time-unknown"),
  };
}
