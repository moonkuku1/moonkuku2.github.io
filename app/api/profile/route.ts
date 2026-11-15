import { z } from "zod";
import { buildProfileCard } from "../../../lib/profile-card";
import { clientIp, jsonResponse as json, kstToday, makeLimiter } from "../../../lib/http";
import { loadLlmConfig } from "../../../lib/llm/config";
import { getProfile } from "../../../lib/llm/run";
import { sampleProfile } from "../../../lib/llm/sample";
import { calculateChart } from "../../../lib/saju/chart";
import { findTerm } from "../../../lib/saju/solar-terms";

/**
 * 무료 사주 프로필 카드 API (요구사항 4.6, 7.1): 가입 없이 쓰고, 생년월일은 서버에 저장하지 않는다.
 * 요청 본문(POST)으로만 받고 로그에 남기지 않는다. 응답에도 생년월일은 넣지 않는다.
 * 저장되는 것은 명식 해시를 키로 한 사주 프로필(키워드 문장)뿐이다.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  calendar: z.enum(["solar", "lunar"]),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  leap: z.boolean().optional(),
  hour: z.number().int().min(0).max(23).nullable(),
  minute: z.number().int().min(0).max(59).optional(),
  gender: z.enum(["male", "female"]),
});

const limited = makeLimiter(30);

export async function POST(req: Request) {
  if (limited(clientIp(req))) return json({ error: "잠시 후에 다시 시도해 주세요." }, 429);

  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return json({ error: "요청 형식이 맞지 않아요." }, 400);
  }
  if (!parsed.success) return json({ error: "입력값을 확인해 주세요.", fields: parsed.error.issues.map((i) => i.path.join(".")) }, 400);
  const b = parsed.data;

  let chart;
  try {
    chart = calculateChart({ calendar: b.calendar, year: b.year, month: b.month, day: b.day, leap: b.leap, hour: b.hour, minute: b.minute, gender: b.gender });
  } catch (e) {
    const msg = (e as Error).message ?? "";
    // 없는 날짜·시각, 윤달이 없는 해, 변환표 범위 밖 등은 사용자에게 그대로 알린다
    if (/날짜|시각|범위|음력|윤|변환표|지원/.test(msg)) return json({ error: msg }, 400);
    console.error("[프로필 계산 오류]", msg.slice(0, 200));
    return json({ error: "사주를 계산하는 중 문제가 생겼어요." }, 500);
  }

  let config;
  try {
    config = loadLlmConfig();
  } catch (e) {
    console.error("[설정 오류]", (e as Error).message);
    return json({ error: "서버 설정을 확인해 주세요." }, 500);
  }

  // 프로필 문장(P1): AI가 켜져 있으면 AI로, 실패하거나 키가 없으면 샘플 문장으로 보여 준다(무료 카드가 멈추지 않게)
  let profile;
  let sample = true;
  try {
    const r = await getProfile(chart, { config });
    profile = r.profile;
    sample = r.source === "sample";
  } catch (e) {
    console.error("[프로필 문장 오류]", (e as Error).message.slice(0, 200));
    profile = sampleProfile(chart);
  }

  const today = kstToday();
  const instant = Date.UTC(today.year, today.month - 1, today.day, 12) / 60000;
  const sajuYear = findTerm(today.year, "입춘").minutes <= instant ? today.year : today.year - 1;
  const card = buildProfileCard(chart, profile, today, sajuYear);
  return json({ status: "ok", sample, card });
}
