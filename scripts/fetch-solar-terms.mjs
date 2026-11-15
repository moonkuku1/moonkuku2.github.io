// 한국천문연구원 "특일 정보"의 24절기를 받아 data/saju/solar-terms.json 으로 저장한다.
// 사용법: node scripts/fetch-solar-terms.mjs [시작연도] [끝연도]
// 키는 .env.local 의 DATA_GO_KR_KEY 만 쓴다. 화면에 출력하지 않는다.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const key = env.match(/^DATA_GO_KR_KEY=(.+)$/m)?.[1]?.trim();
if (!key) throw new Error(".env.local 에 DATA_GO_KR_KEY 가 없어요.");

const from = Number(process.argv[2] ?? 1900);
const to = Number(process.argv[3] ?? 2100);
const BASE = "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo";

// 천문연 응답의 sunLongitude는 최근 연도에만 들어 있어서, 절기 이름으로 태양 경도를 정한다.
export const TERM_LONGITUDE = {
  소한: 285, 대한: 300, 입춘: 315, 우수: 330, 경칩: 345, 춘분: 0, 청명: 15, 곡우: 30,
  입하: 45, 소만: 60, 망종: 75, 하지: 90, 소서: 105, 대서: 120, 입추: 135, 처서: 150,
  백로: 165, 추분: 180, 한로: 195, 상강: 210, 입동: 225, 소설: 240, 대설: 255, 동지: 270,
};

function parse(xml) {
  const code = xml.match(/<resultCode>(.*?)<\/resultCode>/)?.[1];
  if (code !== "00") throw new Error(`응답 오류 ${code}: ${xml.match(/<resultMsg>(.*?)<\/resultMsg>/)?.[1]}`);
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const pick = (tag) => m[1].match(new RegExp(`<${tag}>(.*?)</${tag}>`))?.[1]?.trim() ?? "";
    const loc = pick("locdate");
    const kst = pick("kst").padStart(4, "0");
    return {
      name: pick("dateName"),
      lon: TERM_LONGITUDE[pick("dateName")],
      date: `${loc.slice(0, 4)}-${loc.slice(4, 6)}-${loc.slice(6, 8)}`,
      time: `${kst.slice(0, 2)}:${kst.slice(2, 4)}`,
    };
  });
}

async function fetchYear(year) {
  const items = [];
  for (let month = 1; month <= 12; month++) {
    const url = `${BASE}?solYear=${year}&solMonth=${String(month).padStart(2, "0")}&numOfRows=20&ServiceKey=${key}`;
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        items.push(...parse(text).filter((i) => i.name && i.date.startsWith(`${year}-${String(month).padStart(2, "0")}`)));
        break;
      } catch (e) {
        if (attempt >= 4) throw new Error(`${year}-${month}: ${String(e.message).replace(key, "***")}`);
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }
  }
  return items;
}

const out = {};
const failed = [];
const years = Array.from({ length: to - from + 1 }, (_, i) => from + i);
let next = 0;
async function worker() {
  while (next < years.length) {
    const y = years[next++];
    try {
      const items = await fetchYear(y);
      if (items.length) out[y] = items;
      else failed.push(`${y}: 자료 없음`);
    } catch (e) {
      failed.push(`${y}: ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));

mkdirSync(new URL("../data/saju/", import.meta.url), { recursive: true });
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a - b));
writeFileSync(new URL("../data/saju/solar-terms.json", import.meta.url), JSON.stringify(sorted));
const ys = Object.keys(sorted).map(Number);
console.log(`저장: ${ys.length}년 (${ys[0]}~${ys[ys.length - 1]}), 절기 ${Object.values(sorted).reduce((n, a) => n + a.length, 0)}개`);
const bad = Object.entries(sorted).filter(([, a]) => a.length !== 24).map(([y, a]) => `${y}:${a.length}`);
if (bad.length) console.log("24개가 아닌 해:", bad.slice(0, 20).join(", "));
if (failed.length) console.log("실패:", failed.slice(0, 10).join(" / "), failed.length > 10 ? `... 외 ${failed.length - 10}` : "");

