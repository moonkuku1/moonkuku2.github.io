// 확인용: 천문 계산으로 구한 절기 시각이 한국천문연구원 값과 얼마나 다른지 잰다.
import { readFileSync } from "node:fs";
import { termKstMinutes } from "./terms-calc-lib.mjs";

const table = JSON.parse(readFileSync(new URL("../data/saju/solar-terms.json", import.meta.url), "utf8"));
const diffs = [];
const mismatches = [];
for (const [y, items] of Object.entries(table)) {
  for (const it of items) {
    const [Y, M, D] = it.date.split("-").map(Number);
    const [hh, mm] = it.time.split(":").map(Number);
    const ref = Date.UTC(Y, M - 1, D, hh, mm) / 60000;
    const calc = termKstMinutes(Number(y), it.lon);
    diffs.push(calc - ref);
    if (calc !== ref) mismatches.push(`${it.date} ${it.time} ${it.name} 차이 ${calc - ref}분`);
  }
}
const exact = diffs.filter((d) => d === 0).length;
const max = Math.max(...diffs.map(Math.abs));
console.log(`n=${diffs.length} 정확히 같음=${exact} (${((exact / diffs.length) * 100).toFixed(2)}%) 최대 차이=${max}분`);
console.log("다른 것 앞부분:", mismatches.slice(0, 8).join(" / "));
const byYear = {};
for (const m of mismatches) byYear[m.slice(0, 4)] = (byYear[m.slice(0, 4)] ?? 0) + 1;
const ys = Object.keys(byYear);
console.log("다른 해:", ys.length ? ys.join(",") : "없음");
