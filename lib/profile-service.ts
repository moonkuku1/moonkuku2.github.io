import { z } from "zod";
import { buildProfileCard, type ProfileCard } from "./profile-card";
import { kstToday } from "./http";
import { loadLlmConfig } from "./llm/config";
import { makeCaller } from "./llm/providers";
import { getProfile } from "./llm/run";
import { sampleProfile } from "./llm/sample";
import { calculateChart } from "./saju/chart";
import { findTerm } from "./saju/solar-terms";

/** 무료 카드와 공유 이미지가 함께 쓰는 입력(생년월일은 요청 본문으로만 받는다) */
export const BirthBody = z.object({
  calendar: z.enum(["solar", "lunar"]),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  leap: z.boolean().optional(),
  hour: z.number().int().min(0).max(23).nullable(),
  minute: z.number().int().min(0).max(59).optional(),
  gender: z.enum(["male", "female"]),
});
export type BirthBody = z.infer<typeof BirthBody>;

/** 사용자에게 그대로 보여 줘도 되는 오류(입력 문제) */
export class UserInputError extends Error {}
/** 서버 설정 문제 */
export class ConfigError extends Error {}

export async function makeCard(b: BirthBody): Promise<{ card: ProfileCard; sample: boolean }> {
  let chart;
  try {
    chart = calculateChart({ calendar: b.calendar, year: b.year, month: b.month, day: b.day, leap: b.leap, hour: b.hour, minute: b.minute, gender: b.gender });
  } catch (e) {
    const msg = (e as Error).message ?? "";
    // 없는 날짜·시각, 윤달이 없는 해, 변환표 범위 밖 등은 사용자에게 그대로 알린다
    if (/날짜|시각|범위|음력|윤|변환표|지원/.test(msg)) throw new UserInputError(msg);
    throw e;
  }

  let config;
  try {
    config = loadLlmConfig();
  } catch (e) {
    console.error("[설정 오류]", (e as Error).message);
    throw new ConfigError("서버 설정을 확인해 주세요.");
  }

  // 프로필 문장(P1): AI가 켜져 있으면 AI로, 실패하거나 키가 없으면 샘플 문장으로 보여 준다(무료 카드가 멈추지 않게).
  // AI가 20초 안에 답하지 못해도 기다리게 하지 않는다.
  let profile;
  let sample = true;
  try {
    const caller = config.mode === "live" ? makeCaller(config, { timeoutMs: 20_000 }) : undefined;
    const r = await getProfile(chart, { config, caller });
    profile = r.profile;
    sample = r.sample;
  } catch (e) {
    console.error("[프로필 문장 오류]", (e as Error).message.slice(0, 200));
    profile = sampleProfile(chart);
  }

  const today = kstToday();
  const instant = Date.UTC(today.year, today.month - 1, today.day, 12) / 60000;
  const sajuYear = findTerm(today.year, "입춘").minutes <= instant ? today.year : today.year - 1;
  return { card: buildProfileCard(chart, profile, today, sajuYear), sample };
}

