// 한국천문연구원 음양력 정보로 음력 달력(각 달의 시작 양력 날짜, 날수, 윤달)을 받아 data/saju/lunar-months.json 에 저장한다.
// 사용법: node scripts/fetch-lunar.mjs [시작연도] [끝연도]   (천문연 자료는 2050년까지)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { lunarMonthStarts } from "./kasi-lib.mjs";

const from = Number(process.argv[2] ?? 1899);
const to = Number(process.argv[3] ?? 2050);
const path = new URL("../data/saju/lunar-months.json", import.meta.url);
const out = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : [];
const have = new Set(out.map((r) => `${r.y}-${r.m}-${r.leap ? 1 : 0}`));

const jobs = [];
for (let y = from; y <= to; y++) for (let m = 1; m <= 12; m++) jobs.push([y, m]);
const failed = [];
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const [y, m] = jobs[next++];
    if (have.has(`${y}-${m}-0`)) continue; // 이미 받은 달은 건너뛴다
    try {
      const items = await lunarMonthStarts(y, m);
      if (!items.length) {
        failed.push(`${y}-${m}: 자료 없음`);
        continue;
      }
      for (const it of items) {
        out.push({ y, m, leap: it.lunar.leap, start: it.solar, days: it.monthDays });
      }
    } catch (e) {
      failed.push(`${y}-${m}: ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 2 }, worker));
out.sort((a, b) => a.start.localeCompare(b.start));
writeFileSync(path, JSON.stringify(out));
console.log(`저장: ${out.length}개 달 (${out[0]?.start} ~ ${out.at(-1)?.start}), 윤달 ${out.filter((r) => r.leap).length}개`);
if (failed.length) console.log("실패:", failed.slice(0, 10).join(" / "), failed.length > 10 ? `... 외 ${failed.length - 10}` : "");
