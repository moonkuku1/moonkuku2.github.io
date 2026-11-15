// 테스트용 기준값: 천문연 "음양력 정보"에서 날짜별 음력·일진을 받아 data/saju/reference-kasi.json 에 저장한다.
// 절기 날짜 앞뒤, 연초·연말, 윤일, 윤달 경계, 무작위 날짜를 섞어서 약 300일을 받는다.
import { readFileSync, writeFileSync } from "node:fs";
import { solarToLunar } from "./kasi-lib.mjs";

const terms = JSON.parse(readFileSync(new URL("../data/saju/solar-terms.json", import.meta.url), "utf8"));
const dates = new Set();
const add = (y, m, d) => dates.add(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
const shift = (iso, delta) => {
  const t = new Date(iso + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + delta);
  return t.toISOString().slice(0, 10);
};

// 1) 절기 날짜와 앞뒤 하루 (입춘·경칩·동지 등 연·월주 경계가 있는 해)
for (const y of [1924, 1954, 1961, 1984, 1988, 2000, 2012, 2020, 2024, 2025, 2026]) {
  for (const t of terms[y]) for (const d of [-1, 0, 1]) dates.add(shift(t.date, d));
}
// 2) 연초·연말·윤일
for (const y of [1900, 1920, 1960, 1988, 2000, 2024, 2028, 2050, 2100]) {
  add(y, 1, 1);
  add(y, 12, 31);
}
for (const d of ["1900-02-28", "1900-03-01", "1904-02-29", "2000-02-29", "2024-02-29", "2096-02-29"]) dates.add(d);
// 3) 서머타임·표준시 변경 시기 날짜
for (const d of ["1948-06-01", "1954-03-21", "1961-08-10", "1987-05-10", "1988-05-08", "1988-10-09"]) dates.add(d);
// 4) 무작위(고정 씨앗) 날짜 120개: 1900~2100
let seed = 20261114;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
for (let i = 0; i < 120; i++) {
  const y = 1900 + Math.floor(rnd() * 201);
  const m = 1 + Math.floor(rnd() * 12);
  const d = 1 + Math.floor(rnd() * 28);
  add(y, m, d);
}

import { existsSync } from "node:fs";
const refPath = new URL("../data/saju/reference-kasi.json", import.meta.url);
// 이미 받아 둔 날짜는 건너뛴다(중간에 실패한 날짜만 다시 받는다).
const out = existsSync(refPath) ? JSON.parse(readFileSync(refPath, "utf8")) : [];
const have = new Set(out.map((r) => r.date));
const list = [...dates].sort().filter((d) => !have.has(d));
let next = 0;
async function worker() {
  while (next < list.length) {
    const iso = list[next++];
    const [y, m, d] = iso.split("-").map(Number);
    try {
      const r = await solarToLunar(y, m, d);
      if (r) out.push({ date: iso, iljin: r.iljin, secha: r.secha, wolgeon: r.wolgeon, lunar: r.lunar, monthDays: r.monthDays });
      else console.log("자료 없음:", iso);
    } catch (e) {
      console.log("실패:", iso, e.message);
    }
  }
}
await Promise.all(Array.from({ length: 2 }, worker));
out.sort((a, b) => a.date.localeCompare(b.date));
writeFileSync(new URL("../data/saju/reference-kasi.json", import.meta.url), JSON.stringify(out));
console.log(`저장: ${out.length}일 / 요청 ${list.length}일 (${out[0]?.date} ~ ${out.at(-1)?.date})`);

