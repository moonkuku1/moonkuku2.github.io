import { getQuestion, guideOf, type Guide } from "@/lib/questions";

export type Element = "wood" | "fire" | "earth" | "metal" | "water";
export type Tone = "good" | "careful";
export type MonthFlow = "good" | "normal" | "careful";

/** 판정 엔진이 돌려줄 결과 모양. 화면은 이 모양만 읽는다. */
export type Verdict = {
  orderId: string;
  questionId: string;
  guide: Guide;
  headline: string;
  tone: Tone;
  confidence: 1 | 2 | 3; // 약·중·강
  summary: [string, string];
  months: MonthFlow[]; // 12개
  pillars: { label: string; stem: string; branch: string; stemEl: Element; branchEl: Element; usedStem: boolean; usedBranch: boolean }[];
  evidence: [string, string, string];
  counter: string;
  prescription: string;
  nextQuestionIds: string[];
  birthLabel: string; // 화면에만 쓴다. 공유 이미지에는 넣지 않는다.
};

export const CONFIDENCE_LABEL = { 1: "약", 2: "중", 3: "강" } as const;

// 판정 엔진(lib/verdict)이 아직 없어서 화면 확인용 샘플 결과를 쓴다. 엔진이 붙으면 이 함수만 바꾼다.
export function getVerdict(orderId: string, questionId = "L04"): Verdict | null {
  const q = getQuestion(questionId);
  if (!q) return null;
  return {
    orderId,
    questionId: q.id,
    guide: guideOf(q),
    headline: "5월과 9월이 가장 유력해요.",
    tone: "good",
    confidence: 2,
    summary: ["올해는 인연이 들어오는 문이 두 번 열려요.", "서두르지 않고 새 모임에 한 곳만 나가 보세요."],
    months: ["normal", "careful", "normal", "normal", "good", "normal", "normal", "careful", "good", "normal", "normal", "normal"],
    pillars: [
      { label: "연주", stem: "乙", branch: "亥", stemEl: "wood", branchEl: "water", usedStem: false, usedBranch: false },
      { label: "월주", stem: "己", branch: "卯", stemEl: "earth", branchEl: "wood", usedStem: false, usedBranch: false },
      { label: "일주", stem: "丙", branch: "寅", stemEl: "fire", branchEl: "wood", usedStem: false, usedBranch: true },
      { label: "시주", stem: "甲", branch: "午", stemEl: "wood", branchEl: "fire", usedStem: true, usedBranch: false },
    ],
    evidence: [
      "일지(배우자궁)에 인연을 부르는 글자가 있어요.",
      "올해 세운에서 배우자성이 5월과 9월에 힘을 얻어요.",
      "용신 오행이 들어오는 달과 겹쳐요.",
    ],
    counter: "봄 두 달은 마음이 앞서 판단이 흐려질 수 있어요.",
    prescription: "이번 달에는 새로운 모임 한 곳에 나가 보세요.",
    nextQuestionIds: ["L10", "L11", "L12"],
    birthLabel: "샘플 · 생년월일 정보는 여기에만 보여요",
  };
}

export const ELEMENT_COLOR: Record<Element, string> = {
  wood: "var(--color-oh-wood)",
  fire: "var(--color-oh-fire)",
  earth: "var(--color-oh-earth)",
  metal: "var(--color-oh-metal)",
  water: "var(--color-oh-water)",
};

export const ELEMENT_NAME: Record<Element, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

