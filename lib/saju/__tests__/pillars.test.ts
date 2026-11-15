import { describe, expect, it } from "vitest";
import kasiTerms from "../../../data/saju/solar-terms.json";
import reference from "../../../data/saju/reference-kasi.json";
import { dayPillarOfDate } from "../day-hour";
import { fourPillars } from "../pillars";
import { findTerm, jeolAround, minutesOf, partsOf, termsOfYear, TABLE_FIRST_YEAR, TABLE_LAST_YEAR } from "../solar-terms";

type Ref = { date: string; iljin: string; secha: string; wolgeon: string; lunar: { year: number; month: number; day: number; leap: boolean } };
const REF = reference as Ref[];

function at(date: string, time: string | null) {
  const [y, m, d] = date.split("-").map(Number);
  if (time === null) return { year: y, month: m, day: d, hour: null };
  const [hh, mm] = time.split(":").map(Number);
  return { year: y, month: m, day: d, hour: hh, minute: mm };
}
const names = (p: ReturnType<typeof fourPillars>) => [p.year.name, p.month.name, p.day.name, p.hour?.name ?? null];

describe("절기 시각표", () => {
  it("1899~2101년 모두 24개씩, 시각 순서", () => {
    for (let y = TABLE_FIRST_YEAR - 1; y <= TABLE_LAST_YEAR + 1; y++) {
      const t = termsOfYear(y);
      expect(t).toHaveLength(24);
      for (let i = 1; i < t.length; i++) expect(t[i].minutes).toBeGreaterThan(t[i - 1].minutes);
    }
  });
  it("천문연 값을 그대로 읽는다: 2024 입춘 17:27, 2021 동지 12월 22일 00:59", () => {
    expect(partsOf(findTerm(2024, "입춘").minutes)).toMatchObject({ year: 2024, month: 2, day: 4, hour: 17, minute: 27 });
    expect(partsOf(findTerm(2021, "동지").minutes)).toMatchObject({ year: 2021, month: 12, day: 22, hour: 0, minute: 59 });
    expect(findTerm(2024, "입춘").source).toBe("kasi");
  });
  it("천문연 자료가 없는 해는 계산값을 쓴다", () => {
    expect(findTerm(1910, "입춘").source).toBe("calc");
    expect(findTerm(2050, "입춘").source).toBe("calc");
  });
  it("저장된 천문연 값 전체(2,616개)가 시각표와 같다", () => {
    let n = 0;
    for (const [y, items] of Object.entries(kasiTerms as Record<string, { name: string; date: string; time: string }[]>)) {
      for (const it of items) {
        expect(findTerm(Number(y), it.name).minutes).toBe(minutesOf(it.date, it.time));
        n++;
      }
    }
    expect(n).toBe(2616);
  });
});

describe("일주: 천문연 일진과 대조", () => {
  it(`기준 ${REF.length}일 전부 일치`, () => {
    expect(REF.length).toBeGreaterThanOrEqual(800);
    const wrong: string[] = [];
    for (const r of REF) {
      const [y, m, d] = r.date.split("-").map(Number);
      const got = dayPillarOfDate(y, m, d).name;
      if (got !== r.iljin) wrong.push(`${r.date} 천문연 ${r.iljin} / 계산 ${got}`);
    }
    expect(wrong).toEqual([]);
  });
});

describe("연주: 입춘 시각 기준 (요구사항 1.3)", () => {
  it("2024-02-04: 입춘 17:27 직전은 계묘년, 17:27부터 갑진년", () => {
    expect(fourPillars(at("2024-02-04", "17:26")).year.name).toBe("계묘");
    expect(fourPillars(at("2024-02-04", "17:27")).year.name).toBe("갑진");
  });
  it("양력 1월 1일에 해가 바뀌지 않는다", () => {
    expect(fourPillars(at("2000-01-01", "12:00")).year.name).toBe("기묘");
    // 2000 입춘은 2월 4일 21:40 (천문연)
    expect(fourPillars(at("2000-02-04", "12:00")).year.name).toBe("기묘");
    expect(fourPillars(at("2000-02-04", "21:39")).year.name).toBe("기묘");
    expect(fourPillars(at("2000-02-04", "21:40")).year.name).toBe("경진");
  });
  it("1984년은 입춘(2월 5일 00:19) 뒤부터 갑자년", () => {
    expect(fourPillars(at("1984-06-01", "12:00")).year.name).toBe("갑자");
    expect(fourPillars(at("1984-01-15", "12:00")).year.name).toBe("계해");
    expect(fourPillars(at("1984-02-04", "23:59")).year.name).toBe("계해");
    expect(fourPillars(at("1984-02-05", "00:19")).year.name).toBe("갑자");
  });
  it("천문연 세차와 대조: 3~12월 날짜 전부 일치(1월~2월은 음력 설날 기준이라 비교하지 않는다)", () => {
    const wrong: string[] = [];
    let n = 0;
    for (const r of REF) {
      const [y, m, d] = r.date.split("-").map(Number);
      if (m < 3 || y < TABLE_FIRST_YEAR || y > TABLE_LAST_YEAR) continue;
      n++;
      const got = fourPillars({ year: y, month: m, day: d, hour: 12, minute: 0 }).year.name;
      if (got !== r.secha) wrong.push(`${r.date} 천문연 ${r.secha} / 계산 ${got}`);
    }
    expect(n).toBeGreaterThan(300);
    expect(wrong).toEqual([]);
  });
});

describe("월주: 12절 시각 기준 (요구사항 1.3)", () => {
  it("2024-02-04 17:27에 병인월이 시작, 그 전은 을축월", () => {
    expect(fourPillars(at("2024-02-04", "17:26")).month.name).toBe("을축");
    expect(fourPillars(at("2024-02-04", "17:27")).month.name).toBe("병인");
  });
  it("2000-01-01은 병자월(대설 이후), 소한(1월 6일) 이후는 정축월", () => {
    expect(fourPillars(at("2000-01-01", "12:00")).month.name).toBe("병자");
    expect(fourPillars(at("2000-01-07", "12:00")).month.name).toBe("정축");
  });
  it("양력 1일이 아니라 절입 시각에 바뀐다: 2023 망종 직전은 사월(입하), 정각부터 오월(망종, 계묘년이라 무오월)", () => {
    const t = findTerm(2023, "망종");
    const p = partsOf(t.minutes);
    const before = partsOf(t.minutes - 1);
    const b = fourPillars({ year: before.year, month: before.month, day: before.day, hour: before.hour, minute: before.minute });
    const a = fourPillars({ year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute });
    expect(b.month.branch).toBe(5); // 사
    expect(a.month.branch).toBe(6); // 오
    expect(a.month.name).toBe("무오");
  });
  it("12절마다 절입 1분 전과 정각을 비교: 월 지지가 한 칸씩 넘어가고, 연주는 입춘에서만 바뀐다 (천문연 절기 1,308개)", () => {
    const failures: string[] = [];
    let n = 0;
    for (let year = 1921; year <= 2027; year++) {
      for (const t of jeolAround(year).filter((x) => partsOf(x.minutes).year === year)) {
        const b = partsOf(t.minutes - 1);
        const a = partsOf(t.minutes);
        const before = fourPillars({ year: b.year, month: b.month, day: b.day, hour: b.hour, minute: b.minute });
        const after = fourPillars({ year: a.year, month: a.month, day: a.day, hour: a.hour, minute: a.minute });
        n++;
        const nextBranch = (before.month.branch + 1) % 12;
        if (after.month.branch !== nextBranch) failures.push(`${year} ${t.name}: 월 지지 ${before.month.branch}→${after.month.branch}`);
        const stemStep = (after.month.stem - before.month.stem + 10) % 10;
        if (stemStep !== 1 && !(t.name === "입춘")) failures.push(`${year} ${t.name}: 월 천간이 한 칸 가지 않음`);
        const yearChanged = before.year.index !== after.year.index;
        if (yearChanged !== (t.name === "입춘")) failures.push(`${year} ${t.name}: 연주 변화 ${yearChanged}`);
      }
    }
    expect(n).toBeGreaterThanOrEqual(1200);
    expect(failures).toEqual([]);
  });
  it("월 천간 규칙(오호둔): 갑·기년은 병인월, 을·경년 무인월, 병·신년 경인월, 정·임년 임인월, 무·계년 갑인월", () => {
    // 인월 한가운데(입춘 후 10일)로 확인: 2024 갑진 병인, 2025 을사 무인, 2026 병오 경인, 2027 정미 임인, 2028 무신 갑인
    const cases: [number, string][] = [[2024, "병인"], [2025, "무인"], [2026, "경인"], [2027, "임인"], [2028, "갑인"], [2029, "병인"]];
    for (const [y, expected] of cases) expect(fourPillars(at(`${y}-02-20`, "12:00")).month.name).toBe(expected);
  });
});

describe("시간 모름과 경계 (요구사항 1.6)", () => {
  it("시주가 없고, 평범한 날은 경계 표시가 없다", () => {
    const p = fourPillars(at("2000-06-15", null));
    expect(p.hour).toBeNull();
    expect(p.timeUnknown).toBe(true);
    expect(p.boundaryAmbiguous).toBe(false);
  });
  it("입춘날처럼 하루 안에 연·월이 바뀌는 날은 경계 표시가 켜진다", () => {
    expect(fourPillars(at("2024-02-04", null)).boundaryAmbiguous).toBe(true); // 입춘 17:27
    expect(fourPillars(at("2021-12-07", null)).boundaryAmbiguous).toBe(true); // 대설 06:57
    expect(fourPillars(at("2021-12-22", null)).boundaryAmbiguous).toBe(false); // 동지(중기)는 월을 바꾸지 않는다
  });
});

describe("기준 생년월일 (전체 네 기둥)", () => {
  // 일주는 천문연 일진, 연주·월주는 천문연 절기 시각과 오호둔 규칙, 시주는 일간별 자시 규칙으로 손으로 풀어 확인한 값.
  const gold: { when: [string, string]; expected: [string, string, string | null, string | null]; note: string }[] = [
    { when: ["2000-01-01", "00:30"], expected: ["기묘", "병자", "무오", "임자"], note: "2000 새벽: 입춘 전이라 기묘년, 대설 뒤라 병자월" },
    { when: ["2000-01-01", "23:30"], expected: ["기묘", "병자", "기미", "갑자"], note: "23시대: 다음 날 일주" },
    { when: ["2024-02-04", "17:26"], expected: ["계묘", "을축", "무술", "신유"], note: "입춘 1분 전" },
    { when: ["2024-02-04", "17:27"], expected: ["갑진", "병인", "무술", "신유"], note: "입춘 정각" },
    { when: ["1984-02-04", "23:59"], expected: ["계해", "을축", null, null], note: "1984 입춘(2/5 00:19) 직전" },
    { when: ["1984-02-05", "00:19"], expected: ["갑자", "병인", null, null], note: "1984 입춘 정각" },
    { when: ["2000-02-04", "21:39"], expected: ["기묘", "정축", null, null], note: "2000 입춘(21:40) 1분 전" },
    { when: ["2000-02-04", "21:40"], expected: ["경진", "무인", null, null], note: "2000 입춘 정각" },
  ];
  for (const g of gold) {
    it(`${g.when.join(" ")} (${g.note})`, () => {
      const got = names(fourPillars(at(g.when[0], g.when[1])));
      g.expected.forEach((e, i) => {
        if (e !== null) expect(got[i]).toBe(e);
      });
    });
  }
});
describe("입력 검사", () => {
  it("없는 날짜·범위 밖 연도는 오류", () => {
    expect(() => fourPillars(at("2023-02-29", "12:00"))).toThrow();
    expect(() => fourPillars({ year: 1899, month: 12, day: 31, hour: 12 })).toThrow();
    expect(() => fourPillars({ year: 2101, month: 1, day: 1, hour: 12 })).toThrow();
    expect(() => fourPillars({ year: 2000, month: 1, day: 1, hour: 24 })).toThrow();
  });
  it("1900-01-01과 2100-12-31도 계산된다 (앞뒤 해 절기 사용)", () => {
    expect(fourPillars({ year: 1900, month: 1, day: 1, hour: 12 }).month.name).toBeTruthy();
    expect(fourPillars({ year: 2100, month: 12, day: 31, hour: 12 }).month.name).toBeTruthy();
  });
});

