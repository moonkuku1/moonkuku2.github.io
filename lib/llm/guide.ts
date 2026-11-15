import categoriesJson from "../../data/categories.json";
import guidesJson from "../../data/guides.json";
import questionsJson from "../../data/questions.json";

/** 서버 쪽 문장 생성에서 쓰는 풀이꾼 정보 (화면용 lib/questions.ts와 같은 데이터를 읽는다) */
export type GuideId = "assi" | "doryeong" | "haechi";

type CategoryRow = { code: string; name: string; guide: GuideId };
type GuideRow = { id: GuideId; name: string; voice: string };
type QuestionRow = { id: string; categoryCode: string; title: string; answerFormat: string };

const categories = categoriesJson as CategoryRow[];
const guides = guidesJson as GuideRow[];
const questions = questionsJson as unknown as QuestionRow[];

export function questionRow(id: string): QuestionRow {
  const q = questions.find((x) => x.id === id);
  if (!q) throw new Error(`없는 질문이에요: ${id}`);
  return q;
}

export function categoryNameOf(code: string): string {
  return categories.find((c) => c.code === code)?.name ?? code;
}

/** 질문을 맡은 풀이꾼. 카테고리 설정 데이터 한 곳에서만 정한다(요구사항 4.4-1). */
export function guideOfQuestion(id: string): GuideId {
  const q = questionRow(id);
  return categories.find((c) => c.code === q.categoryCode)?.guide ?? "haechi";
}

export function guideName(id: GuideId): string {
  return guides.find((g) => g.id === id)?.name ?? id;
}

/**
 * 풀이꾼별 말투 규칙(P2의 9번 규칙 자리에 들어간다, 요구사항 4.10-3).
 * 기준 문서의 9번 규칙은 "솔직한 선배. ~해요체"였고, 사장님 결정(2026-11-14)으로 풀이꾼 말투로 바꿨다.
 */
export const VOICE_RULE: Record<GuideId, string> = {
  assi: `9. 말투는 다정한 풀이꾼 '삼백 아씨'. "~해요"체, 짧은 문장, 감탄사·이모지 금지.`,
  doryeong: `9. 말투는 점잖은 풀이꾼 '삼백 도령'. "~습니다", "~지요"체, 짧은 문장, 감탄사·이모지 금지.`,
  haechi: `9. 말투는 옛말투를 쓰는 해치 '삼백이'. "~다", "~하여라", "~이니라"처럼 예스러운 반말, 짧은 문장, 감탄사·이모지 금지. "~요"나 "~습니다"로 끝내지 않는다.`,
};
