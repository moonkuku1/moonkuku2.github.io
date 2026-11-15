import { describe, expect, it } from "vitest";
import { analyzeElements, tenGod } from "../analysis/elements";
import { majorLuck, monthLuck, yearLuck } from "../analysis/luck";
import { analyzeRelations } from "../analysis/relations";
import { analyzeSinsal, samjae, twelveSinsal, TWELVE_NAMES } from "../analysis/sinsal";
import { B, BRANCH_ELEMENT, HIDDEN_STEMS, STEM_ELEMENT, mainStemOf } from "../analysis/tables";
import { calculateChart, type ChartInput } from "../chart";
import { STEMS, indexFromName, pillarFromIndex } from "../ganji";
import type { FourPillars } from "../pillars";
import { findTerm, jeolAround } from "../solar-terms";

const mk = (year: string, month: string, day: string, hour?: string): FourPillars => ({
  year: pillarFromIndex(indexFromName(year)),
  month: pillarFromIndex(indexFromName(month)),
  day: pillarFromIndex(indexFromName(day)),
  hour: hour ? pillarFromIndex(indexFromName(hour)) : null,
  sajuYear: 2000,
  timeUnknown: !hour,
  boundaryAmbiguous: false,
});

describe("표와 십성", () => {
  it("지장간의 본기 오행은 그 지지의 오행과 같다", () => {
    for (let b = 0; b < 12; b++) expect(STEM_ELEMENT[mainStemOf(b)]).toBe(BRANCH_ELEMENT[b]);
    expect(HIDDEN_STEMS).toHaveLength(12);
  });
  it("일간 갑: 갑 비견, 을 겁재, 병 식신, 정 상관, 무 편재, 기 정재, 경 편관, 신 정관, 임 편인, 계 정인", () => {
    const got = STEMS.map((_, s) => tenGod(0, s));
    expect(got).toEqual(["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"]);
  });
  it("어느 일간이든 열 천간이 열 가지 십성에 하나씩 대응한다", () => {
    for (let d = 0; d < 10; d++) expect(new Set(STEMS.map((_, s) => tenGod(d, s))).size).toBe(10);
  });
  it("일간 무(양토): 기 겁재, 병 편인, 임 편재, 을 정관, 계 정재", () => {
    expect(tenGod(4, 5)).toBe("겁재");
    expect(tenGod(4, 2)).toBe("편인");
    expect(tenGod(4, 8)).toBe("편재");
    expect(tenGod(4, 1)).toBe("정관");
    expect(tenGod(4, 9)).toBe("정재");
  });
});

describe("오행 분포 (기묘 병자 무오 임자)", () => {
  const a = analyzeElements(mk("기묘", "병자", "무오", "임자"));
  it("겉으로 보이는 글자: 목1 화2 토2 금0 수3", () => {
    expect(a.surface).toEqual({ 목: 1, 화: 2, 토: 2, 금: 0, 수: 3 });
  });
  it("금이 없고, 십성은 천간·지지 본기 기준", () => {
    expect(a.missing).toEqual(["금"]);
    const byPos = Object.fromEntries(a.characters.map((c) => [c.position, c]));
    expect(byPos["연"].stem.god).toBe("겁재");
    expect(byPos["월"].stem.god).toBe("편인");
    expect(byPos["일"].stem.god).toBeNull();
    expect(byPos["시"].stem.god).toBe("편재");
    expect(byPos["연"].branch.god).toBe("정관"); // 묘 본기 을
    expect(byPos["월"].branch.god).toBe("정재"); // 자 본기 계
    expect(byPos["일"].branch.god).toBe("정인"); // 오 본기 정
    expect(byPos["시"].branch.god).toBe("정재");
  });
  it("지장간까지 센 오행 합은 글자 수(8)와 같다", () => {
    const sum = Object.values(a.withHidden).reduce((x, y) => x + y, 0);
    expect(Math.round(sum * 100) / 100).toBe(8);
  });
  it("시주가 없으면 6글자 기준", () => {
    const six = analyzeElements(mk("기묘", "병자", "무오"));
    expect(Object.values(six.surface).reduce((x, y) => x + y, 0)).toBe(6);
  });
});

describe("합·충·형·파·해·원진", () => {
  const kinds = (p: FourPillars) => analyzeRelations(p).map((r) => `${r.kind}:${r.places.join("-")}`);
  it("기묘 병자 무오 임자: 자오충(월-일, 일-시), 묘오파, 자묘형, 병임충", () => {
    const r = kinds(mk("기묘", "병자", "무오", "임자"));
    expect(r).toContain("충:월지-일지");
    expect(r).toContain("충:일지-시지");
    expect(r).toContain("파:연지-일지");
    expect(r).toContain("형:연지-월지");
    expect(r).toContain("형:연지-시지");
    expect(r).toContain("천간충:월간-시간");
    expect(r.some((x) => x.startsWith("천간합"))).toBe(false);
  });
  it("삼합: 신자진이 모두 있으면 수국 삼합, 붙어 있으면 adjacent", () => {
    const hit = analyzeRelations(mk("갑신", "병자", "무진")).find((r) => r.kind === "삼합");
    expect(hit?.element).toBe("수");
    expect(hit?.adjacent).toBe(true);
    expect(hit?.chars).toEqual(["신", "자", "진"]);
  });
  it("반합: 왕지가 있는 두 글자(해묘)만 있어도 목 반합", () => {
    const r = analyzeRelations(mk("을해", "정묘", "경오")).filter((x) => x.kind === "반합");
    expect(r.some((x) => x.chars.join("") === "해묘" && x.element === "목")).toBe(true);
  });
  it("방합: 인묘진", () => {
    expect(analyzeRelations(mk("갑인", "을묘", "무진")).some((x) => x.kind === "방합" && x.element === "목")).toBe(true);
  });
  it("삼형 완성: 인사신", () => {
    const r = analyzeRelations(mk("갑인", "을사", "병신"));
    expect(r.some((x) => x.kind === "형" && x.label?.includes("삼형 완성"))).toBe(true);
  });
  it("자형: 오오, 천간합: 갑기 토, 육합: 자축 토, 원진: 자미, 해: 자미도 해", () => {
    expect(analyzeRelations(mk("병오", "갑오", "무진")).some((x) => x.kind === "자형")).toBe(true);
    const c = analyzeRelations(mk("갑자", "기축", "신미"));
    expect(c.find((x) => x.kind === "천간합")?.element).toBe("토");
    expect(c.find((x) => x.kind === "육합")?.element).toBe("토");
    expect(c.some((x) => x.kind === "원진" && x.chars.join("") === "자미")).toBe(true);
    expect(c.some((x) => x.kind === "해" && x.chars.join("") === "자미")).toBe(true);
  });
});

describe("12신살과 신살", () => {
  it("12신살은 12개 지지에 하나씩, 연살(도화)·역마·화개는 삼합 그룹별 표와 같다", () => {
    for (let b = 0; b < 12; b++) expect(new Set(Object.values(twelveSinsal(b))).size).toBe(12);
    const pick = (base: string) => twelveSinsal(B(base));
    expect([pick("신").연살, pick("해").연살, pick("인").연살, pick("사").연살]).toEqual([B("유"), B("자"), B("묘"), B("오")]);
    expect([pick("자").역마, pick("묘").역마, pick("오").역마, pick("유").역마]).toEqual([B("인"), B("사"), B("신"), B("해")]);
    expect([pick("진").화개, pick("미").화개, pick("술").화개, pick("축").화개]).toEqual([B("진"), B("미"), B("술"), B("축")]);
    expect(TWELVE_NAMES).toHaveLength(12);
  });
  it("기묘 병자 무오 임자: 연지 기준 도화(자)는 월지·시지, 일지 기준 도화(묘)는 연지", () => {
    const s = analyzeSinsal(mk("기묘", "병자", "무오", "임자"));
    const dohwa = s.hits.filter((h) => h.name === "도화");
    expect(dohwa.find((h) => h.basis === "연지")?.places).toEqual(["월지", "시지"]);
    expect(dohwa.find((h) => h.basis === "일지")?.places).toEqual(["연지"]);
    expect(s.hits.some((h) => h.name === "천을귀인")).toBe(false);
  });
  it("일간 기준: 갑 일간은 축·미가 천을귀인, 사가 문창, 오가 홍염", () => {
    const s = analyzeSinsal(mk("신미", "정사", "갑오", "기축"));
    expect(s.hits.filter((h) => h.name === "천을귀인").map((h) => h.chars).sort()).toEqual(["미", "축"]);
    expect(s.hits.find((h) => h.name === "문창귀인")?.chars).toBe("사");
    expect(s.hits.find((h) => h.name === "홍염살")?.chars).toBe("오");
  });
  it("기둥 기준: 백호대살(갑진), 괴강살(경진), 귀문관살(자유)", () => {
    expect(analyzeSinsal(mk("갑진", "병인", "경진")).hits.map((h) => h.name)).toEqual(expect.arrayContaining(["백호대살", "괴강살"]));
    expect(analyzeSinsal(mk("계유", "병자", "무오")).hits.some((h) => h.name === "귀문관살" && h.chars === "유자")).toBe(true);
  });
  it("삼재: 묘(해묘미)년생은 사오미년에 들삼재·눌삼재·날삼재", () => {
    const born = B("묘");
    expect(samjae(born, 2025)).toMatchObject({ active: true, phase: "들삼재", years: [2025, 2026, 2027] });
    expect(samjae(born, 2026).phase).toBe("눌삼재");
    expect(samjae(born, 2027).phase).toBe("날삼재");
    expect(samjae(born, 2028).active).toBe(false);
    expect(samjae(B("자"), 2022).phase).toBe("들삼재"); // 신자진생은 인묘진년
  });
});

describe("대운·세운·월운", () => {
  const base: ChartInput = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" };

  it("기묘년(음간) 남자는 역행: 월주 병자 다음 대운은 을해, 갑술", () => {
    const c = calculateChart(base);
    expect(c.majorLuck.direction).toBe("역행");
    expect(c.majorLuck.periods.slice(0, 3).map((p) => p.pillar.name)).toEqual(["을해", "갑술", "계유"]);
  });
  it("기묘년 여자는 순행: 정축, 무인", () => {
    const c = calculateChart({ ...base, gender: "female" });
    expect(c.majorLuck.direction).toBe("순행");
    expect(c.majorLuck.periods.slice(0, 2).map((p) => p.pillar.name)).toEqual(["정축", "무인"]);
  });
  it("시작 나이 = 절기까지 일수 ÷ 3 (역행은 직전 절기: 1999 대설)", () => {
    const c = calculateChart(base);
    const daeseol = findTerm(1999, "대설");
    expect(c.majorLuck.basis.name).toBe("대설");
    const birth = Date.UTC(2000, 0, 1, 0, 30) / 60000;
    const days = (birth - daeseol.minutes) / 1440;
    expect(c.majorLuck.startAgeYears).toBeCloseTo(days / 3, 2);
    // 대운은 10년 간격으로 이어진다
    const p = c.majorLuck.periods;
    expect(p[1].startAge - p[0].startAge).toBeCloseTo(10, 5);
    expect(p).toHaveLength(10);
  });
  it("순행은 다음 절기(소한)까지", () => {
    const c = calculateChart({ ...base, gender: "female" });
    expect(c.majorLuck.basis.name).toBe("소한");
    const sohan = findTerm(2000, "소한");
    const birth = Date.UTC(2000, 0, 1, 0, 30) / 60000;
    expect(c.majorLuck.startAgeYears).toBeCloseTo((sohan.minutes - birth) / 1440 / 3, 2);
  });
  it("시작 나이 환산: 3일=1년, 1일=4개월 (정확히 9일 → 3년)", () => {
    const p = calculateChart(base).pillars;
    const jeol = jeolAround(2000).find((t) => t.name === "소한")!;
    const birth = jeol.minutes - 9 * 1440; // 소한 9일 전
    const forward = majorLuck({ ...p, year: pillarFromIndex(indexFromName("기묘")) }, "female", birth, 1999);
    expect(forward.start).toEqual({ years: 3, months: 0, days: 0 });
    const oneDay = majorLuck({ ...p, year: pillarFromIndex(indexFromName("기묘")) }, "female", jeol.minutes - 1440, 1999);
    expect(oneDay.start).toEqual({ years: 0, months: 4, days: 0 });
  });
  it("세운은 입춘 기준 연 간지, 월운은 인월부터 열두 달", () => {
    expect(yearLuck(2024).name).toBe("갑진");
    expect(yearLuck(1984).name).toBe("갑자");
    const m = monthLuck(2024);
    expect(m).toHaveLength(12);
    expect(m[0]).toMatchObject({ term: "입춘", date: "2024-02-04", time: "17:27" });
    expect(m.map((x) => x.pillar.name)).toEqual(["병인", "정묘", "무진", "기사", "경오", "신미", "임신", "계유", "갑술", "을해", "병자", "정축"]);
  });
  it("기준 연도를 주면 세운·월운·삼재가 함께 나온다", () => {
    const c = calculateChart({ ...base, options: { referenceYear: 2026 } });
    expect(c.yearly?.pillar.name).toBe("병오");
    expect(c.yearly?.months).toHaveLength(12);
    expect(c.yearly?.samjae.phase).toBe("눌삼재"); // 묘년생, 2026 오년
    expect(calculateChart(base).yearly).toBeNull();
  });
});

describe("결과 JSON (요구사항 1.8)", () => {
  it("같은 입력이면 분석까지 포함해 같은 JSON", () => {
    const input: ChartInput = { calendar: "lunar", year: 1990, month: 5, day: 17, hour: 14, minute: 20, gender: "female", options: { referenceYear: 2027 } };
    expect(JSON.stringify(calculateChart(input))).toBe(JSON.stringify(calculateChart({ ...input })));
  });
  it("시간 모름이어도 분석이 나온다 (시주 없이 6글자)", () => {
    const c = calculateChart({ calendar: "solar", year: 1995, month: 8, day: 20, hour: null, gender: "male" });
    expect(c.pillars.hour).toBeNull();
    expect(c.elements.characters).toHaveLength(3);
    expect(c.majorLuck.periods).toHaveLength(10);
  });
});

