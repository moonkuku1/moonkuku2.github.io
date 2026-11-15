// 천문연 자료(1920~2028)가 없는 연도의 절기 시각을 천문 계산으로 만들어 data/saju/solar-terms-calc.json 에 저장한다.
// 계산식은 천문연 값 2,616개와 비교해 최대 1분 차이를 확인했다(scripts/check-terms.mjs).
import { readFileSync, writeFileSync } from "node:fs";
import { TERM_NAMES, minutesToParts, termKstMinutes } from "./terms-calc-lib.mjs";

const kasi = JSON.parse(readFileSync(new URL("../data/saju/solar-terms.json", import.meta.url), "utf8"));
const FROM = 1899; // 1900년 1월 출생의 월주에 1899년 대설이 필요하다
const TO = 2101; // 2100년 12월 출생의 월주에 2101년 소한이 필요하다
const out = {};
for (let y = FROM; y <= TO; y++) {
  if (kasi[y]) continue;
  out[y] = TERM_NAMES.map(([name, lon]) => ({ name, lon, ...minutesToParts(termKstMinutes(y, lon)) })).sort(
    (a, b) => (a.date + a.time).localeCompare(b.date + b.time),
  );
}
writeFileSync(new URL("../data/saju/solar-terms-calc.json", import.meta.url), JSON.stringify(out));
const ys = Object.keys(out).map(Number);
console.log(`계산: ${ys.length}년 (${ys[0]}~${ys[ys.length - 1]})`);
const sample = out[2050]?.find((t) => t.name === "입춘");
console.log("예: 2050 입춘", sample?.date, sample?.time);
