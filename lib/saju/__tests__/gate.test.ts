import { Solar } from "lunar-javascript";
import { describe, expect, it } from "vitest";
import gateJson from "../../../data/saju/gate-cases.json";
import reference from "../../../data/saju/reference-kasi.json";
import { calculateChart, type ChartInput } from "../chart";

/**
 * 요구사항 1.9의 관문: 기준 생년월일 20개 이상 + 입춘일·절입일·자시·서머타임 경계 케이스.
 * 각 케이스를 두 가지 독립된 기준으로 확인한다.
 *  1) 한국천문연구원 음양력 정보의 일진(일주)과 음력 날짜
 *  2) 다른 만세력 라이브러리(lunar-javascript)의 연·월·일·시주
 */
type Case = ChartInput & { id: string; label: string; kasiDay: string; exactTermMinute?: boolean };
const CASES = gateJson as unknown as Case[];
type Ref = { date: string; iljin: string; lunar: { year: number; month: number; day: number; leap: boolean } };
const REF = new Map((reference as Ref[]).map((r) => [r.date, r]));

/** lunar-javascript로 같은 순간의 네 기둥을 구한다(연·월주는 중국 표준시 기준이라 한 시간을 뺀 시각으로 묻는다). */
function theirs(y: number, m: number, d: number, h: number, mi: number, termShiftMinutes = 0) {
  const clock = Solar.fromYmdHms(y, m, d, h, mi, 0).getLunar().getEightChar();
  clock.setSect(1);
  const cst = new Date(Date.UTC(y, m - 1, d, h, mi) - 3600000 + termShiftMinutes * 60000);
  const term = Solar.fromYmdHms(cst.getUTCFullYear(), cst.getUTCMonth() + 1, cst.getUTCDate(), cst.getUTCHours(), cst.getUTCMinutes(), 0).getLunar().getEightChar();
  return { year: term.getYear(), month: term.getMonth(), day: clock.getDay(), time: clock.getTime() };
}

describe("기준 생년월일 (요구사항 1.9)", () => {
  it("기준 케이스가 20개 이상이고 모두 천문연 일진이 있다", () => {
    expect(CASES.length).toBeGreaterThanOrEqual(20);
    for (const c of CASES) expect(REF.has(c.kasiDay), `${c.id} ${c.kasiDay}`).toBe(true);
  });

  for (const c of CASES) {
    it(`${c.id} ${c.label}`, () => {
      const chart = calculateChart(c);

      // 1) 천문연 일진: 일주가 같아야 한다(23시대는 다음 날 일진)
      expect(chart.pillars.day.name, "일주(천문연 일진)").toBe(REF.get(c.kasiDay)!.iljin);

      // 음력 입력이면 천문연의 음력 날짜와 같은 날로 변환됐는지 확인
      if (c.calendar === "lunar") {
        const k = REF.get(c.kasiDay)!;
        expect(k.lunar).toEqual({ year: c.year, month: c.month, day: c.day, leap: c.leap ?? false });
        const s = chart.solarDate;
        expect(`${s.year}-${String(s.month).padStart(2, "0")}-${String(s.day).padStart(2, "0")}`).toBe(c.kasiDay);
      }

      // 2) 다른 만세력 라이브러리와 연·월·시주(시간을 알 때)
      const t = chart.clock ?? { year: chart.solarDate.year, month: chart.solarDate.month, day: chart.solarDate.day, hour: 12, minute: 0 };
      // 절입 정각(천문연 분 단위)은 초를 알 수 없어 상대 라이브러리와 1분 안에서 갈릴 수 있다. 연·월주는 1분 뒤 시각으로 비교한다.
      const other = theirs(t.year, t.month, t.day, t.hour, t.minute, c.exactTermMinute ? 1 : 0);
      if (c.hour !== null) {
        expect(chart.pillars.year.hanja, "연주").toBe(other.year);
        expect(chart.pillars.month.hanja, "월주").toBe(other.month);
        expect(chart.pillars.day.hanja, "일주(다른 만세력)").toBe(other.day);
        expect(chart.pillars.hour!.hanja, "시주").toBe(other.time);
      } else {
        // 시간을 모르면 정오 기준. 그날 절기가 바뀌는 날이면 월·연주는 비교하지 않고 경고 표시만 확인한다.
        expect(chart.pillars.hour).toBeNull();
        expect(chart.lowerConfidence).toBe(true);
        if (!chart.pillars.boundaryAmbiguous) {
          expect(chart.pillars.year.hanja).toBe(other.year);
          expect(chart.pillars.month.hanja).toBe(other.month);
        } else {
          expect(chart.notes).toContain("term-boundary");
        }
        expect(chart.pillars.day.hanja).toBe(other.day);
      }
    });
  }

  it("입춘 직전·정각 케이스는 연주가 실제로 다르다(경계가 작동한다)", () => {
    const y = (id: string) => calculateChart(CASES.find((c) => c.id === id)!).pillars.year.name;
    expect(y("G01")).not.toBe(y("G02"));
    expect(y("G03")).not.toBe(y("G04"));
    expect(y("G05")).not.toBe(y("G06"));
    expect(y("G07")).not.toBe(y("G08"));
  });
  it("서머타임 케이스는 보정이 표시된다", () => {
    for (const id of ["G14", "G15", "G16", "G18", "G20"]) {
      const chart = calculateChart(CASES.find((c) => c.id === id)!);
      expect(chart.notes, id).toContain("dst-applied");
    }
    for (const id of ["G17", "G19"]) expect(calculateChart(CASES.find((c) => c.id === id)!).notes, id).not.toContain("dst-applied");
  });
});

