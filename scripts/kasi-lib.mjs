// 한국천문연구원 "음양력 정보"(getLunCalInfo / getSolCalInfo) 호출 도우미. 키는 .env.local 에서만 읽는다.
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const key = env.match(/^DATA_GO_KR_KEY=(.+)$/m)?.[1]?.trim();
if (!key) throw new Error(".env.local 에 DATA_GO_KR_KEY 가 없어요.");

const BASE = "https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService";
const p2 = (n) => String(n).padStart(2, "0");

function tag(xml, name) {
  return xml.match(new RegExp(`<${name}>(.*?)</${name}>`))?.[1]?.trim() ?? "";
}

async function call(path, query) {
  const url = `${BASE}/${path}?${query}&ServiceKey=${key}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const text = await (await fetch(url)).text();
      if (tag(text, "resultCode") !== "00") throw new Error(`응답 오류 ${tag(text, "resultCode")} ${tag(text, "resultMsg")}`);
      return text;
    } catch (e) {
      if (attempt >= 6) throw new Error(String(e.message).replace(key, "***"));
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

function item(xml) {
  if (!xml.includes("<item>")) return null;
  return {
    solar: `${tag(xml, "solYear")}-${tag(xml, "solMonth")}-${tag(xml, "solDay")}`,
    lunar: { year: Number(tag(xml, "lunYear")), month: Number(tag(xml, "lunMonth")), day: Number(tag(xml, "lunDay")), leap: tag(xml, "lunLeapmonth") === "윤" },
    secha: tag(xml, "lunSecha").slice(0, 2),
    wolgeon: tag(xml, "lunWolgeon").slice(0, 2),
    iljin: tag(xml, "lunIljin").slice(0, 2),
    monthDays: Number(tag(xml, "lunNday")),
  };
}

/** 양력 날짜의 음력·간지 */
export async function solarToLunar(y, m, d) {
  return item(await call("getLunCalInfo", `solYear=${y}&solMonth=${p2(m)}&solDay=${p2(d)}`));
}

/** 음력 한 달의 첫날(평달, 윤달이 있으면 윤달도)의 양력 날짜와 그 달의 날수 */
export async function lunarMonthStarts(y, m) {
  const xml = await call("getSolCalInfo", `lunYear=${y}&lunMonth=${p2(m)}&lunDay=01`);
  return [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map((x) => item(x[0])).filter(Boolean);
}

/** 음력 날짜의 양력(윤달이면 leap=true). 해당 날짜가 없으면 null */
export async function lunarToSolar(y, m, d, leap = false) {
  const xml = await call("getSolCalInfo", `lunYear=${y}&lunMonth=${p2(m)}&lunDay=${p2(d)}`);
  const items = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map((x) => item(x[0]));
  return items.find((i) => i && i.lunar.leap === leap) ?? null;
}

