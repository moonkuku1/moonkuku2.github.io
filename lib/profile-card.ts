import type { Chart } from "./saju/chart";
import type { Profile } from "./llm/schemas";
import { todayLine, type TodayLine } from "./today";
import { recommendQuestions, type Recommendation } from "./recommend";

/**
 * 무료 사주 프로필 카드(요구사항 4.6)에 보여 줄 값. 생년월일·출생 시각은 담지 않는다(사주 글자와 분석 값만).
 */
export type CardChar = { ch: string; element: "wood" | "fire" | "earth" | "metal" | "water"; label: string };
export type CardPillar = { label: "연주" | "월주" | "일주" | "시주"; name: string; stem: CardChar; branch: CardChar };

export type ProfileCard = {
  pillars: CardPillar[];
  /** 예: "무오일주" */
  dayPillar: string;
  dayStem: string;
  strength: { level: string; ratio: number };
  structure: string;
  helpful: string[];
  avoid: string[];
  missing: string[];
  profile: Pick<Profile, "keywords" | "theme" | "strength" | "watch" | "shareLine">;
  today: TodayLine;
  recommendations: Recommendation[];
  /** 화면에 알려야 할 사항(시간 모름, 서머타임 보정 등) */
  notes: string[];
  timeUnknown: boolean;
};

const EL = ["wood", "fire", "earth", "metal", "water"] as const;
const NOTE_TEXT: Record<Chart["notes"][number], string> = {
  "time-unknown": "태어난 시간을 몰라 시주 없이 계산했어요. 풀이의 확신도가 한 단계 낮아져요.",
  "dst-applied": "서머타임 기간에 태어나셔서 시계 시각에서 한 시간을 뺀 시각으로 계산했어요.",
  "dst-ambiguous": "서머타임이 끝나는 시각이라 같은 시각이 두 번 있었어요. 먼저 온 쪽(서머타임)으로 계산했어요.",
  "dst-nonexistent": "서머타임이 시작하며 건너뛴 시각이라 실제로는 없던 시각이에요. 시작 전 시계로 읽었어요.",
  "term-boundary": "태어난 날에 절기가 바뀌어서, 태어난 시간을 알면 연주나 월주가 달라질 수 있어요.",
};

/** 명식표에 쓰는 기둥들(사주 글자와 오행 색) */
export function pillarsOf(chart: Chart): CardPillar[] {
  const p = chart.pillars;
  const list = [
    { label: "연주" as const, pillar: p.year, pos: "연" },
    { label: "월주" as const, pillar: p.month, pos: "월" },
    { label: "일주" as const, pillar: p.day, pos: "일" },
    ...(p.hour ? [{ label: "시주" as const, pillar: p.hour, pos: "시" }] : []),
  ];
  return list.map(({ label, pillar, pos }) => {
    const c = chart.elements.characters.find((x) => x.position === pos)!;
    return {
      label,
      name: pillar.name,
      stem: { ch: pillar.hanja[0], element: EL[c.stem.element], label: c.stem.elementName },
      branch: { ch: pillar.hanja[1], element: EL[c.branch.element], label: c.branch.elementName },
    };
  });
}

export function buildProfileCard(
  chart: Chart,
  profile: Profile,
  now: { year: number; month: number; day: number },
  sajuYear: number,
): ProfileCard {
  const p = chart.pillars;
  const pillars = pillarsOf(chart);

  return {
    pillars,
    dayPillar: `${p.day.name}일주`,
    dayStem: `${chart.elements.dayStem}${chart.elements.dayElement}`,
    strength: { level: chart.strength.level, ratio: chart.strength.ratio },
    structure: chart.structure.name,
    helpful: chart.yongshin.helpful.map((h) => h.element),
    avoid: chart.yongshin.avoid.map((h) => h.element),
    missing: chart.elements.missing,
    profile: { keywords: profile.keywords, theme: profile.theme, strength: profile.strength, watch: profile.watch, shareLine: profile.shareLine },
    today: todayLine(chart, now),
    recommendations: recommendQuestions(chart, sajuYear, 3),
    notes: chart.notes.map((n) => NOTE_TEXT[n]),
    timeUnknown: chart.lowerConfidence,
  };
}

