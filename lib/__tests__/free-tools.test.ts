import { describe, expect, it } from "vitest";
import { RELATION_TEXT, STEM_TEXT } from "../free-content";
import { makeIlgan, makeOhaeng, makeTti, relationKinds } from "../free-tools";

const base = { calendar: "solar" as const, hour: null, gender: "female" as const };

describe("무료 풀이: 오행·일간·띠", () => {
  it("오행 분포의 합은 글자 수와 같다(시간 모름 6, 아는 경우 8)", () => {
    const sum = (r: ReturnType<typeof makeOhaeng>) => Math.round(r.counts.reduce((n, c) => n + c.value, 0) * 10) / 10;
    expect(sum(makeOhaeng({ ...base, year: 1990, month: 5, day: 15 }))).toBeCloseTo(6, 0);
    expect(sum(makeOhaeng({ ...base, year: 1990, month: 5, day: 15, hour: 9, minute: 0 }))).toBeCloseTo(8, 0);
  });
  it("일간 열 가지가 모두 풀이를 갖는다", () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const r = makeIlgan({ ...base, year: 1995, month: 3, day: d });
      expect(r.info).toBe(STEM_TEXT[r.stem]);
      seen.add(r.stem);
    }
    expect(seen.size).toBe(10);
  });
  it("띠는 입춘 기준이다(1990년 1월은 아직 뱀띠, 5월은 말띠)", () => {
    expect(makeTti({ ...base, year: 1990, month: 1, day: 10 }).animal).toBe("뱀");
    expect(makeTti({ ...base, year: 1990, month: 5, day: 15 }).animal).toBe("말");
  });
  it("띠 관계 표: 말띠(6)와 쥐(0)는 충, 말띠와 양(7)은 육합, 말띠와 범(2)은 삼합, 같은 띠는 본띠", () => {
    expect(relationKinds(6, 0)).toContain("충");
    expect(relationKinds(6, 7)).toContain("육합");
    expect(relationKinds(6, 2)).toContain("삼합");
    expect(relationKinds(6, 6)).toEqual(["본띠"]);
  });
  it("띠 결과의 관계는 모두 설명 문장이 있다", () => {
    for (let y = 1980; y <= 1991; y++) for (const r of makeTti({ ...base, year: y, month: 6, day: 1 }).relations) expect(RELATION_TEXT[r.kind]).toBeTruthy();
  });
});