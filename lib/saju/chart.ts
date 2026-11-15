import { correctClock, type ClockMode, type ClockResult } from "./clock";
import { lunarToSolar } from "./lunar";
import { fourPillars, type FourPillars } from "./pillars";
import type { DayHourOptions } from "./day-hour";

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
  gender: "male" | "female";
  options?: DayHourOptions & { clockMode?: ClockMode };
};

export type Chart = {
  input: ChartInput;
  /** 계산에 쓴 양력 생년월일(음력이면 변환한 값, 시계 보정 전) */
  solarDate: { year: number; month: number; day: number };
  /** 시계 보정 결과(서머타임 등). 시간을 모르면 null */
  clock: ClockResult | null;
  pillars: FourPillars;
  /** 시간을 모르거나 절기 경계라 화면에 알려야 할 사항 */
  notes: ("time-unknown" | "dst-applied" | "dst-ambiguous" | "dst-nonexistent" | "term-boundary")[];
  /** 확신도를 한 단계 낮춰야 하는지 (요구사항 1.6, 2.5) */
  lowerConfidence: boolean;
};

/**
 * 생년월일시(양력 또는 음력)로 사주 여덟 글자를 계산한다. 같은 입력이면 항상 같은 값이다(요구사항 1.8).
 * 오행·십성·대운 등 해석에 쓰는 값은 이 결과 위에서 따로 계산한다.
 */
export function calculateChart(input: ChartInput): Chart {
  const solar = input.calendar === "lunar" ? lunarToSolar(input.year, input.month, input.day, input.leap ?? false) : { year: input.year, month: input.month, day: input.day };

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

  return { input, solarDate: solar, clock, pillars, notes, lowerConfidence: input.hour === null };
}
