import { Solar } from "lunar-javascript";
import { describe, expect, it } from "vitest";
import { fourPillars } from "../pillars";
import { jeolAround, partsOf } from "../solar-terms";

/**
 * 독립 검증: 널리 쓰는 만세력 라이브러리(lunar-javascript)와 연·월·일·시주를 비교한다.
 * 그쪽은 절기를 초 단위로, 우리는 천문연 분 단위 값으로 계산하므로 절입 시각 앞뒤 3분은 따로 본다.
 */
/**
 * sect 2: 23시대 일주는 당일(우리의 야자시 옵션), sect 1: 23시대 일주는 다음 날(우리의 기본).
 * 그쪽 라이브러리는 중국 표준시(UTC+8)로 절기를 쓰므로, 같은 순간을 비교하려면 연·월주는 한국 시각에서 한 시간을 뺀 시각으로 묻는다.
 * 일주·시주는 시계 시각이 기준이라 그대로 묻는다.
 */
function theirs(y: number, m: number, d: number, h: number, mi: number, sect: 1 | 2 = 1) {
  const clock = Solar.fromYmdHms(y, m, d, h, mi, 0).getLunar().getEightChar();
  clock.setSect(sect);
  const cst = new Date(Date.UTC(y, m - 1, d, h, mi) - 3600000);
  const term = Solar.fromYmdHms(cst.getUTCFullYear(), cst.getUTCMonth() + 1, cst.getUTCDate(), cst.getUTCHours(), cst.getUTCMinutes(), 0).getLunar().getEightChar();
  return [term.getYear(), term.getMonth(), clock.getDay(), clock.getTime()];
}
function ours(y: number, m: number, d: number, h: number, mi: number, lateZiSameDay = false) {
  const p = fourPillars({ year: y, month: m, day: d, hour: h, minute: mi }, { lateZiSameDay });
  return [p.year.hanja, p.month.hanja, p.day.hanja, p.hour!.hanja];
}

// 고정 씨앗 난수
let seed = 20261115;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

const nearBoundary = (() => {
  const set: number[] = [];
  for (let y = 1920; y <= 2028; y++) for (const t of jeolAround(y)) set.push(t.minutes);
  set.sort((a, b) => a - b);
  return (minutes: number) => set.some((t) => Math.abs(t - minutes) <= 3);
})();

describe("다른 만세력 라이브러리와 비교", () => {
  it("무작위 6,000건(1921~2027년): 연·월·일·시주 네 기둥이 모두 같다", () => {
    const wrong: string[] = [];
    let n = 0;
    while (n < 6000) {
      const y = 1921 + Math.floor(rnd() * 107);
      const m = 1 + Math.floor(rnd() * 12);
      const d = 1 + Math.floor(rnd() * 28);
      const h = Math.floor(rnd() * 24);
      const mi = Math.floor(rnd() * 60);
      if (nearBoundary(Date.UTC(y, m - 1, d, h, mi) / 60000)) continue;
      n++;
      const a = ours(y, m, d, h, mi).join(" ");
      const b = theirs(y, m, d, h, mi).join(" ");
      if (a !== b) wrong.push(`${y}-${m}-${d} ${h}:${mi} 우리 ${a} / 상대 ${b}`);
    }
    expect(wrong.slice(0, 10)).toEqual([]);
  });

  it("23시 전후(자시)와 자정 부근 2,000건: 기본은 sect 1, 야자시 옵션은 sect 2와 같다", () => {
    const wrong: string[] = [];
    for (let i = 0; i < 2000; i++) {
      const y = 1921 + Math.floor(rnd() * 107);
      const m = 1 + Math.floor(rnd() * 12);
      const d = 1 + Math.floor(rnd() * 28);
      const h = [22, 23, 0, 1][Math.floor(rnd() * 4)];
      const mi = Math.floor(rnd() * 60);
      if (nearBoundary(Date.UTC(y, m - 1, d, h, mi) / 60000)) continue;
      for (const [late, sect] of [[false, 1], [true, 2]] as const) {
        const a = ours(y, m, d, h, mi, late).join(" ");
        const b = theirs(y, m, d, h, mi, sect).join(" ");
        if (a !== b) wrong.push(`${y}-${m}-${d} ${h}:${mi} ${late ? "야자시" : "기본"} 우리 ${a} / 상대 ${b}`);
      }
    }
    expect(wrong.slice(0, 10)).toEqual([]);
  });

  it("절입 시각 경계: 천문연 절입 2분 전은 둘 다 이전 달, 1분 뒤는 둘 다 새 달 (12절 × 106년 = 2,500여 번)", () => {
    const wrong: string[] = [];
    let n = 0;
    for (let year = 1921; year <= 2027; year++) {
      for (const t of jeolAround(year).filter((x) => partsOf(x.minutes).year === year)) {
        for (const [delta, label] of [[-2, "직전"], [1, "직후"]] as const) {
          const p = partsOf(t.minutes + delta);
          const a = ours(p.year, p.month, p.day, p.hour, p.minute).slice(0, 2).join(" ");
          const b = theirs(p.year, p.month, p.day, p.hour, p.minute).slice(0, 2).join(" ");
          n++;
          if (a !== b) wrong.push(`${t.name} ${year} ${label}: 우리 ${a} / 상대 ${b}`);
        }
      }
    }
    expect(n).toBeGreaterThan(2400);
    expect(wrong.slice(0, 10)).toEqual([]);
  });

  it("범위 양 끝(1900~1920, 2029~2100)도 같다: 계산한 절기 시각을 쓰는 구간 1,500건", () => {
    const wrong: string[] = [];
    let n = 0;
    while (n < 1500) {
      const y = rnd() < 0.5 ? 1900 + Math.floor(rnd() * 21) : 2029 + Math.floor(rnd() * 72);
      const m = 1 + Math.floor(rnd() * 12);
      const d = 1 + Math.floor(rnd() * 28);
      const h = Math.floor(rnd() * 24);
      const mi = Math.floor(rnd() * 60);
      // 이 구간은 계산값이라 절입 앞뒤 5분은 제외
      const minutes = Date.UTC(y, m - 1, d, h, mi) / 60000;
      if (jeolAround(y).some((t) => Math.abs(t.minutes - minutes) <= 5)) continue;
      n++;
      const a = ours(y, m, d, h, mi).join(" ");
      const b = theirs(y, m, d, h, mi).join(" ");
      if (a !== b) wrong.push(`${y}-${m}-${d} ${h}:${mi} 우리 ${a} / 상대 ${b}`);
    }
    expect(wrong.slice(0, 10)).toEqual([]);
  });
});


