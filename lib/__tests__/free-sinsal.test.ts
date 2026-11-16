import { describe, expect, it } from "vitest";
import { SINSAL_MEANING, makeSinsal } from "../free-sinsal";
import { UserInputError } from "../profile-service";

const base = { calendar: "solar" as const, hour: null, gender: "female" as const };

describe("무료 신살 조회", () => {
  it("시간을 모르면 기둥 3개, 알면 4개", () => {
    expect(makeSinsal({ ...base, year: 1990, month: 5, day: 15 }).pillars).toHaveLength(3);
    expect(makeSinsal({ ...base, year: 1990, month: 5, day: 15, hour: 9, minute: 0 }).pillars).toHaveLength(4);
  });
  it("찾은 신살마다 뜻풀이가 있고, 같은 이름이 겹치지 않는다", () => {
    for (let y = 1960; y <= 2005; y += 3) {
      for (let m = 1; m <= 12; m += 4) {
        const r = makeSinsal({ ...base, year: y, month: m, day: 12, hour: 14, minute: 30 });
        const names = r.found.map((f) => f.name);
        expect(new Set(names).size).toBe(names.length);
        for (const f of r.found) {
          expect(SINSAL_MEANING[f.name]).toBeTruthy();
          expect(f.where.length).toBeGreaterThan(0);
        }
        expect(r.found.length + r.absent.length).toBe(Object.keys(SINSAL_MEANING).length);
      }
    }
  });
  it("삼재에 해당하면 3년 기간을, 아니면 빈 목록을 준다", () => {
    for (let y = 1980; y <= 1991; y++) {
      const s = makeSinsal({ ...base, year: y, month: 6, day: 10 }).samjae;
      expect(s.years).toHaveLength(s.active ? 3 : 0);
    }
  });
  it("없는 날짜는 입력 오류로 알린다", () => {
    expect(() => makeSinsal({ ...base, year: 1990, month: 2, day: 30 })).toThrow(UserInputError);
  });
});