import { describe, expect, it } from "vitest";
import published from "../../data/q-published.json";
import { ALL_QUESTION_IDS } from "../verdict/recipes";
import { isPublished, readingPoints } from "../q-pages";

describe("질문 소개 페이지 데이터", () => {
  it("모든 질문에서 설명을 만들 수 있고, 질문 데이터의 요소가 있다", () => {
    for (const id of ALL_QUESTION_IDS) {
      const r = readingPoints(id);
      expect(r.elements.length, id).toBeGreaterThan(0);
    }
  });
  it("공개 목록에는 실제 있는 질문 ID만 들어 있다", () => {
    const ids = new Set(ALL_QUESTION_IDS);
    for (const id of published as string[]) expect(ids.has(id), id).toBe(true);
  });
  it("검토 전 질문은 공개되지 않는다", () => {
    expect(isPublished("L04")).toBe((published as string[]).includes("L04"));
  });
});
