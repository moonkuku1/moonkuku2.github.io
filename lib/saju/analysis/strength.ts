import { BRANCHES, STEMS } from "../ganji";
import type { FourPillars } from "../pillars";
import { tenGod, type TenGod } from "./elements";
import { mainStemOf } from "./tables";

/**
 * 신강·신약 (방식 A: 자리별 점수, docs/saju-decisions.md 2-1).
 * 일간(나)을 돕는 글자(비견·겁재·편인·정인)가 차지하는 점수 비율로 판단한다.
 * 자리별 점수: 월지 3(월령), 일지 2, 연지·시지·연간·월간·시간 1씩 = 10점. 일간 자신은 세지 않는다.
 * 시간을 모르면 시주(시간·시지) 2점을 빼고 8점으로 비율을 낸다.
 */
export const POSITION_WEIGHTS = { 연간: 1, 월간: 1, 시간: 1, 연지: 1, 월지: 3, 일지: 2, 시지: 1 } as const;

/** 돕는 글자의 비율(0~1)로 5단계를 나눈다. 전문가 검수 후 이 값만 바꾸면 된다. */
export const STRENGTH_THRESHOLDS = {
  /** 이 값 미만이면 극신약 */
  veryWeak: 0.25,
  /** 이 값 미만이면 신약 */
  weak: 0.45,
  /** 이 값 이하이면 중화 (그 위는 신강) */
  balanced: 0.55,
  /** 이 값 이상이면 극신강 */
  veryStrong: 0.75,
} as const;

export type StrengthLevel = "극신약" | "신약" | "중화" | "신강" | "극신강";

export type StrengthPart = {
  place: keyof typeof POSITION_WEIGHTS;
  char: string;
  god: TenGod;
  weight: number;
  /** 일간을 돕는 글자인가 */
  helps: boolean;
};

export type StrengthAnalysis = {
  level: StrengthLevel;
  /** 돕는 글자 점수 / 전체 점수 (0~1, 소수 둘째 자리) */
  ratio: number;
  support: number;
  total: number;
  /** 월령을 얻었는가(월지가 일간을 돕는가) */
  deukryeong: boolean;
  /** 일지가 일간을 돕는가 */
  deukji: boolean;
  parts: StrengthPart[];
};

const HELPS: TenGod[] = ["비견", "겁재", "편인", "정인"];

export function levelOf(ratio: number): StrengthLevel {
  const t = STRENGTH_THRESHOLDS;
  if (ratio < t.veryWeak) return "극신약";
  if (ratio < t.weak) return "신약";
  if (ratio <= t.balanced) return "중화";
  if (ratio < t.veryStrong) return "신강";
  return "극신강";
}

export function analyzeStrength(p: FourPillars): StrengthAnalysis {
  const d = p.day.stem;
  const parts: StrengthPart[] = [];
  const push = (place: StrengthPart["place"], char: string, god: TenGod) =>
    parts.push({ place, char, god, weight: POSITION_WEIGHTS[place], helps: HELPS.includes(god) });

  push("연간", STEMS[p.year.stem], tenGod(d, p.year.stem));
  push("월간", STEMS[p.month.stem], tenGod(d, p.month.stem));
  if (p.hour) push("시간", STEMS[p.hour.stem], tenGod(d, p.hour.stem));
  // 지지는 본기 천간의 십성으로 본다
  push("연지", BRANCHES[p.year.branch], tenGod(d, mainStemOf(p.year.branch)));
  push("월지", BRANCHES[p.month.branch], tenGod(d, mainStemOf(p.month.branch)));
  push("일지", BRANCHES[p.day.branch], tenGod(d, mainStemOf(p.day.branch)));
  if (p.hour) push("시지", BRANCHES[p.hour.branch], tenGod(d, mainStemOf(p.hour.branch)));

  const total = parts.reduce((s, x) => s + x.weight, 0);
  const support = parts.filter((x) => x.helps).reduce((s, x) => s + x.weight, 0);
  const ratio = Math.round((support / total) * 100) / 100;
  const at = (place: StrengthPart["place"]) => parts.find((x) => x.place === place)!;
  return {
    level: levelOf(support / total),
    ratio,
    support,
    total,
    deukryeong: at("월지").helps,
    deukji: at("일지").helps,
    parts,
  };
}
