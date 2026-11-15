import { dayPillarOfDate } from "./saju/day-hour";
import type { Chart } from "./saju/chart";
import { isClash, isCombine, groupOfStem, type Group } from "./signals/context";
import { STEMS } from "./saju/ganji";

/**
 * 삼백이의 오늘 한 마디 (무료).
 * 오늘의 일진(그날의 간지)과 내 일간·일지를 견줘서 코드가 정한다. 판정은 코드, 말투는 해치 삼백이(옛말투 반말)다.
 * 지지가 합이면 "사람 사이", 충이면 "서두르지 말 것"을 먼저 말하고, 아니면 오늘 천간이 내 일간에게 어떤 기운인지(십성 무리)로 말한다.
 */
export type TodayLine = {
  line: string;
  /** 오늘 일진(예: 갑진) */
  todayPillar: string;
  /** 어떤 기준으로 한 줄을 골랐는지(화면에 작게 보여 줌) */
  basis: string;
};

const BY_GROUP: Record<Group, { line: string; plain: string }> = {
  비겁: { line: "오늘은 나와 닮은 이들과 함께할 때 힘이 나느니라. 혼자 끌고 가려 하지 말거라.", plain: "나와 같은 기운" },
  식상: { line: "오늘은 하고 싶은 말을 꺼내기 좋은 날이다. 다만 말은 짧게 하여라.", plain: "표현하는 기운" },
  재성: { line: "오늘은 손에 잡히는 일부터 챙기면 이로우니라. 작은 것을 놓치지 말거라.", plain: "재물과 성과의 기운" },
  관성: { line: "오늘은 맡은 일을 단정히 마치면 인정받느니라. 약속은 지키려무나.", plain: "책임과 규칙의 기운" },
  인성: { line: "오늘은 배우고 쉬며 마음을 채우기 좋은 날이니라. 도움을 청해도 좋다.", plain: "배움과 도움의 기운" },
};
const COMBINE = "오늘은 사람 사이가 순하게 풀리느니라. 먼저 말을 건네 보아라.";
const CLASH = "오늘은 마음이 부딪히기 쉬우니라. 서두르지 말고 한 박자 쉬어라.";

export function todayLine(chart: Chart, today: { year: number; month: number; day: number }): TodayLine {
  const p = dayPillarOfDate(today.year, today.month, today.day);
  const dayStem = chart.pillars.day.stem;
  const dayBranch = chart.pillars.day.branch;

  if (isClash(p.branch, dayBranch)) return { line: CLASH, todayPillar: p.name, basis: `오늘 일진 ${p.name} · 내 일지와 충` };
  if (isCombine(p.branch, dayBranch)) return { line: COMBINE, todayPillar: p.name, basis: `오늘 일진 ${p.name} · 내 일지와 합` };

  const g = groupOfStem(dayStem, p.stem);
  return { line: BY_GROUP[g].line, todayPillar: p.name, basis: `오늘 일진 ${p.name} · 내 일간 ${STEMS[dayStem]}에게 ${BY_GROUP[g].plain}` };
}

export const TODAY_LINES = [COMBINE, CLASH, ...Object.values(BY_GROUP).map((g) => g.line)];
