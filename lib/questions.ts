import questionsJson from "@/data/questions.json";
import categoriesJson from "@/data/categories.json";
import situationsJson from "@/data/situations.json";

export type Question = {
  id: string;
  category: string;
  categoryCode: string;
  order: number;
  title: string;
  description: string;
  people: number;
  price: number;
  status: string;
};

export type Guide = "assi" | "doryeong" | "haechi";

export type Category = {
  code: string;
  name: string;
  poster: string;
  guide: Guide;
  blurb: string;
};

export type Situation = {
  id: string;
  title: string;
  art: string;
  questionIds: string[];
};

/** 개발 중에는 draft도 보인다. 정식 오픈 때 NEXT_PUBLIC_SHOW_DRAFT=false 로 바꾼다. */
const SHOW_DRAFT = process.env.NEXT_PUBLIC_SHOW_DRAFT !== "false";

const all = questionsJson as Question[];

// 데이터 검사 (요구사항 5.6): 문제가 있으면 빌드·실행 때 오류로 알린다.
const seen = new Set<string>();
for (const q of all) {
  if (!q.id || !q.title || !q.categoryCode || typeof q.price !== "number") {
    throw new Error(`questions.json: 필수 칸이 비어 있어요 (${q.id ?? "id 없음"})`);
  }
  if (seen.has(q.id)) throw new Error(`questions.json: ID가 겹쳐요 (${q.id})`);
  seen.add(q.id);
}

export const questions: Question[] = all.filter((q) => SHOW_DRAFT || q.status === "published");
export const categories = categoriesJson as Category[];
export const situations = situationsJson as Situation[];

export function getQuestion(id: string) {
  return questions.find((q) => q.id === id);
}

export function getCategory(code: string) {
  return categories.find((c) => c.code === code);
}

export function guideOf(q: Question): Guide {
  return getCategory(q.categoryCode)?.guide ?? "haechi";
}

export function questionsOf(code: string) {
  return questions.filter((q) => q.categoryCode === code).sort((a, b) => a.order - b.order);
}

export const GUIDE_NAME: Record<Guide, string> = {
  assi: "삼백 아씨",
  doryeong: "삼백 도령",
  haechi: "해치 삼백이",
};

export const IMG = "/images/saju300-images";

export function priceLabel(q: Question) {
  return q.people === 2 ? `두 사람 ${q.price}원` : `하나에 ${q.price}원`;
}
