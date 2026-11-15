import { analyzeElements, type ElementsAnalysis } from "./analysis/elements";
import { majorLuck, monthLuck, yearLuck, type Gender, type MajorLuck, type MonthLuck } from "./analysis/luck";
import { analyzeRelations, type Relation } from "./analysis/relations";
import { analyzeSinsal, samjae, type SamjaeResult, type SinsalAnalysis } from "./analysis/sinsal";
import { analyzeStrength, type StrengthAnalysis } from "./analysis/strength";
import { analyzeStructure, type StructureAnalysis } from "./analysis/structure";
import { analyzeYongshin, type YongshinAnalysis } from "./analysis/yongshin";
import { correctClock, type ClockMode, type ClockResult } from "./clock";
import type { DayHourOptions } from "./day-hour";
import type { Pillar } from "./ganji";
import { isValidDate } from "./calendar";
import { lunarToSolar } from "./lunar";
import { fourPillars, type FourPillars } from "./pillars";
import { minutesOf } from "./solar-terms";

/** 사주 계산에 넣는 값. 시각은 "그때 시계 시각"이다. */
export type ChartInput = {
  calendar: "solar" | "lunar";
  year: number;
  month: number;
  day: number;
  /** 음력일 때 윤달이면 true */
  leap?: boolean;
  /** 모르면 null (요구사항 1.6) */
  hour: number | null;
  minute?: number;
  gender: Gender;
  options?: DayHourOptions & {
    clockMode?: ClockMode;
    /** 세운·월운·삼재를 볼 기준 연도(요구사항 2.8의 기준 연월). 없으면 계산하지 않는다. */
    referenceYear?: number;
  };
};

export type Chart = {
  input: ChartInput;
  /** 계산에 쓴 양력 생년월일(음력이면 변환한 값, 시계 보정 전) */
  solarDate: { year: number; month: number; day: number };
  /** 시계 보정 결과(서머타임 등). 시간을 모르면 null */
  clock: ClockResult | null;
  pillars: FourPillars;
  /** 오행 분포·십성·지장간 */
  elements: ElementsAnalysis;
  /** 신강·신약(자리별 점수) */
  strength: StrengthAnalysis;
  /** 격국(월지 본기 기준) */
  structure: StructureAnalysis;
  /** 도움이 되는 오행·조심할 오행(억부+조후 단순형) */
  yongshin: YongshinAnalysis;
  /** 합·충·형·파·해·원진 */
  relations: Relation[];
  /** 신살과 12신살 */
  sinsal: SinsalAnalysis;
  /** 대운 */
  majorLuck: MajorLuck;
  /** 기준 연도가 있을 때만: 세운·월운·삼재 */
  yearly: { year: number; pillar: Pillar; months: MonthLuck[]; samjae: SamjaeResult } | null;
  /** 시간을 모르거나 절기 경계라 화면에 알려야 할 사항 */
  notes: ("time-unknown" | "dst-applied" | "dst-ambiguous" | "dst-nonexistent" | "term-boundary")[];
  /** 확신도를 한 단계 낮춰야 하는지 (요구사항 1.6, 2.5) */
  lowerConfidence: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * 생년월일시(양력 또는 음력)로 사주 여덟 글자와 분석(오행·십성·합충·신살·대운)을 계산한다.
 * 같은 입력이면 항상 같은 값이다(요구사항 1.8).
 * 신강·신약(자리별 점수), 격국(월지 본기 기준), 도움이 되는 오행(억부+조후 단순형)은 docs/saju-decisions.md 2장의 추천안이다.
 */
export function calculateChart(input: ChartInput): Chart {
  const solar = input.calendar === "lunar" ? lunarToSolar(input.year, input.month, input.day, input.leap ?? false) : { year: input.year, month: input.month, day: input.day };

  // 2월 30일 같은 없는 날짜가 시각 보정 단계에서 조용히 다음 달로 넘어가지 않게 먼저 막는다
  if (!isValidDate(solar.year, solar.month, solar.day)) throw new Error("없는 날짜예요.");
  if (input.hour !== null && (input.hour < 0 || input.hour > 23 || (input.minute ?? 0) < 0 || (input.minute ?? 0) > 59)) throw new Error("없는 시각이에요.");

  const notes: Chart["notes"] = [];
  let clock: ClockResult | null = null;
  let target = { ...solar, hour: input.hour, minute: input.minute ?? 0 };

  if (input.hour !== null) {
    clock = correctClock(solar.year, solar.month, solar.day, input.hour, input.minute ?? 0, input.options?.clockMode ?? "dst-only");
    target = { year: clock.year, month: clock.month, day: clock.day, hour: clock.hour, minute: clock.minute };
    if (clock.dst) notes.push("dst-applied");
    if (clock.ambiguous) notes.push("dst-ambiguous");
    if (clock.nonexistent) notes.push("dst-nonexistent");
  } else {
    notes.push("time-unknown");
  }

  const pillars = fourPillars(target, { lateZiSameDay: input.options?.lateZiSameDay });
  if (pillars.boundaryAmbiguous) notes.push("term-boundary");

  // 대운 시작 나이 계산에 쓰는 출생 시각(KST). 시간을 모르면 정오로 본다.
  const birthMinutes = minutesOf(`${target.year}-${pad(target.month)}-${pad(target.day)}`, target.hour === null ? "12:00" : `${pad(target.hour)}:${pad(target.minute ?? 0)}`);

  const refYear = input.options?.referenceYear;
  const elements = analyzeElements(pillars);
  const strength = analyzeStrength(pillars);
  return {
    input,
    solarDate: solar,
    clock,
    pillars,
    elements,
    strength,
    structure: analyzeStructure(pillars),
    yongshin: analyzeYongshin(pillars, elements, strength),
    relations: analyzeRelations(pillars),
    sinsal: analyzeSinsal(pillars),
    majorLuck: majorLuck(pillars, input.gender, birthMinutes, target.year),
    yearly: refYear === undefined ? null : { year: refYear, pillar: yearLuck(refYear), months: monthLuck(refYear), samjae: samjae(pillars.year.branch, refYear) },
    notes,
    lowerConfidence: input.hour === null,
  };
}


