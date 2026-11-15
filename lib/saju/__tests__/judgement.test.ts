import { describe, expect, it } from "vitest";
import { analyzeElements } from "../analysis/elements";
import { analyzeStrength, levelOf, POSITION_WEIGHTS, STRENGTH_THRESHOLDS } from "../analysis/strength";
import { analyzeStructure } from "../analysis/structure";
import { analyzeYongshin, groupElements } from "../analysis/yongshin";
import { calculateChart } from "../chart";
import { indexFromName, pillarFromIndex } from "../ganji";
import type { FourPillars } from "../pillars";

const mk = (year: string, month: string, day: string, hour?: string): FourPillars => ({
  year: pillarFromIndex(indexFromName(year)),
  month: pillarFromIndex(indexFromName(month)),
  day: pillarFromIndex(indexFromName(day)),
  hour: hour ? pillarFromIndex(indexFromName(hour)) : null,
  sajuYear: 2000,
  timeUnknown: !hour,
  boundaryAmbiguous: false,
});
const judge = (p: FourPillars) => {
  const el = analyzeElements(p);
  const st = analyzeStrength(p);
  return { st, yg: analyzeYongshin(p, el, st), sc: analyzeStructure(p) };
};

describe("신강·신약 (자리별 점수)", () => {
  it("자리별 점수 합은 10점(시간 모름이면 8점)", () => {
    expect(Object.values(POSITION_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(10);
    expect(analyzeStrength(mk("기묘", "병자", "무오", "임자")).total).toBe(10);
    expect(analyzeStrength(mk("기묘", "병자", "무오")).total).toBe(8);
  });
  it("기묘 병자 무오 임자: 돕는 글자는 연간 기(겁재)·월간 병(편인)·일지 오(정인) = 4/10 → 신약", () => {
    const s = analyzeStrength(mk("기묘", "병자", "무오", "임자"));
    expect(s.support).toBe(4);
    expect(s.ratio).toBe(0.4);
    expect(s.level).toBe("신약");
    expect(s.deukryeong).toBe(false); // 월지 자는 정재
    expect(s.deukji).toBe(true); // 일지 오는 정인
  });
  it("갑 일간에 갑인 을묘 갑진 병인: 돕는 글자 7/10 → 신강, 월령을 얻음", () => {
    const s = analyzeStrength(mk("갑인", "을묘", "갑진", "병인"));
    expect(s.support).toBe(7);
    expect(s.level).toBe("신강");
    expect(s.deukryeong).toBe(true);
  });
  it("5단계 경계값", () => {
    const t = STRENGTH_THRESHOLDS;
    expect(levelOf(0)).toBe("극신약");
    expect(levelOf(t.veryWeak - 0.001)).toBe("극신약");
    expect(levelOf(t.veryWeak)).toBe("신약");
    expect(levelOf(t.weak - 0.001)).toBe("신약");
    expect(levelOf(t.weak)).toBe("중화");
    expect(levelOf(t.balanced)).toBe("중화");
    expect(levelOf(t.balanced + 0.001)).toBe("신강");
    expect(levelOf(t.veryStrong - 0.001)).toBe("신강");
    expect(levelOf(t.veryStrong)).toBe("극신강");
    expect(levelOf(1)).toBe("극신강");
  });
  it("시간 모름이면 시주 글자는 점수에 넣지 않는다", () => {
    const s = analyzeStrength(mk("갑인", "을묘", "갑진"));
    expect(s.parts.map((x) => x.place)).not.toContain("시간");
    expect(s.parts.map((x) => x.place)).not.toContain("시지");
    expect(s.support).toBe(6); // 연간1+월간1+연지1+월지3 (시주 제외)
    expect(s.total).toBe(8);
  });
});

describe("격국 (월지 본기)", () => {
  const name = (y: string, m: string, d: string) => analyzeStructure(mk(y, m, d)).name;
  it("무 일간 + 자월(본기 계 = 정재) → 정재격", () => {
    expect(name("기묘", "병자", "무오")).toBe("정재격");
  });
  it("갑 일간 + 묘월(본기 을 = 겁재, 양간) → 양인격", () => {
    expect(name("갑인", "을묘", "갑진")).toBe("양인격");
  });
  it("갑 일간 + 인월(본기 갑 = 비견) → 건록격", () => {
    expect(name("병인", "무인", "갑진")).toBe("건록격");
  });
  it("을 일간 + 인월(본기 갑 = 겁재, 음간) → 월겁격", () => {
    expect(name("병인", "무인", "을축")).toBe("월겁격");
  });
  it("나머지 여덟 십성은 각각의 격으로", () => {
    // 갑 일간 기준: 월지 본기 천간별 격 (사 병=식신, 오 정=상관, 진 무=편재, 미 기=정재, 신 경=편관, 유 신=정관, 해 임=편인, 자 계=정인)
    const cases: [string, string][] = [["사", "식신격"], ["오", "상관격"], ["진", "편재격"], ["미", "정재격"], ["신", "편관격"], ["유", "정관격"], ["해", "편인격"], ["자", "정인격"]];
    const monthOf: Record<string, string> = { 사: "기사", 오: "경오", 진: "무진", 미: "신미", 신: "갑신", 유: "을유", 해: "정해", 자: "무자" };
    for (const [b, expected] of cases) expect(name("갑자", monthOf[b], "갑술")).toBe(expected);
  });
});

describe("도움이 되는 오행 (억부 + 조후)", () => {
  it("오행 무리 대응: 일간 목이면 비겁 목, 인성 수, 식상 화, 재성 토, 관성 금", () => {
    expect(groupElements(0)).toEqual({ 비겁: 0, 인성: 4, 식상: 1, 재성: 2, 관성: 3 });
  });
  it("신강(갑인 을묘 갑진 병인): 부족한 금(관성)이 가장 먼저, 목·수는 조심", () => {
    const { yg } = judge(mk("갑인", "을묘", "갑진", "병인"));
    expect(yg.helpful[0].element).toBe("금");
    expect(yg.helpful.map((x) => x.element)).toEqual(expect.arrayContaining(["금", "화", "토"]));
    expect(yg.avoid.map((x) => x.element).sort()).toEqual(["목", "수"]);
    expect(yg.johu).toBeNull(); // 봄
  });
  it("신약(기묘 병자 무오 임자): 화·토를 돕고, 겨울이라 조후 화가 들어간다", () => {
    const { yg } = judge(mk("기묘", "병자", "무오", "임자"));
    expect(yg.johu).toEqual({ element: "화", season: "한겨울" });
    expect(yg.helpful.map((x) => x.element).sort()).toEqual(["토", "화"]);
    expect(yg.avoid.map((x) => x.element).sort()).toEqual(["금", "목", "수"]);
  });
  it("조후가 억부와 부딪히면 조후를 따른다: 신강한 화 일간이 한여름이어도 수를 도움으로", () => {
    // 병 일간(화) + 오월 + 비겁·인성 많이 → 신강
    const p = mk("병오", "갑오", "병인", "갑오");
    const { st, yg } = judge(p);
    expect(["신강", "극신강"]).toContain(st.level);
    expect(yg.johu).toEqual({ element: "수", season: "한여름" });
    expect(yg.helpful.map((x) => x.element)).toContain("수");
    expect(yg.avoid.map((x) => x.element)).not.toContain("수");
  });
  it("중화이면 가장 적은 오행을 도움으로, 가장 많은 오행을 조심으로", () => {
    // 일간 비중 45~55%가 되는 사주를 찾아 확인
    const names = ["갑자", "을축", "병인", "정묘", "무진", "기사", "경오", "신미", "임신", "계유", "갑술", "을해"];
    let found = false;
    for (const y of names) for (const m of names) for (const d of names) {
      const p = mk(y, m, d);
      const el = analyzeElements(p);
      const st = analyzeStrength(p);
      if (st.level !== "중화") continue;
      const yg = analyzeYongshin(p, el, st);
      if (yg.johu) continue; // 한겨울·한여름은 조후 보정이 들어가므로 별도 규칙(아래 테스트)
      const counts = Object.entries(el.withHidden);
      const min = Math.min(...counts.map(([, v]) => v));
      const max = Math.max(...counts.map(([, v]) => v));
      expect(el.withHidden[yg.helpful[0].element as keyof typeof el.withHidden]).toBe(min);
      expect(el.withHidden[yg.avoid[0].element as keyof typeof el.withHidden]).toBe(max);
      found = true;
      break;
    }
    expect(found).toBe(true);
  });
});

describe("chart 결과에 포함", () => {
  it("2000-01-01 00:30 남자: 신약, 정재격, 도움이 되는 오행에 화", () => {
    const c = calculateChart({ calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" });
    expect(c.strength.level).toBe("신약");
    expect(c.structure.name).toBe("정재격");
    expect(c.yongshin.helpful.map((x) => x.element)).toContain("화");
  });
  it("같은 입력은 같은 결과 JSON", () => {
    const i = { calendar: "solar" as const, year: 1988, month: 7, day: 1, hour: 12, minute: 0, gender: "female" as const };
    expect(JSON.stringify(calculateChart(i))).toBe(JSON.stringify(calculateChart({ ...i })));
  });
});
