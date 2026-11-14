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

const PILLARS: Verdict["pillars"] = [
  { label: "연주", stem: "乙", branch: "亥", stemEl: "wood", branchEl: "water", usedStem: false, usedBranch: false },
  { label: "월주", stem: "己", branch: "卯", stemEl: "earth", branchEl: "wood", usedStem: false, usedBranch: false },
  { label: "일주", stem: "丙", branch: "寅", stemEl: "fire", branchEl: "wood", usedStem: false, usedBranch: true },
  { label: "시주", stem: "甲", branch: "午", stemEl: "wood", branchEl: "fire", usedStem: true, usedBranch: false },
];

type Sample = Pick<Verdict, "headline" | "tone" | "confidence" | "summary" | "months" | "evidence" | "counter" | "prescription" | "nextQuestionIds">;

// 풀이꾼마다 말투가 다르다: 아씨는 다정한 해요체, 도령은 점잖은 ~습니다·~지요체, 해치 삼백이는 옛말투 반말.
const SAMPLES: Record<Guide, { questionId: string; data: Sample }> = {
  assi: {
    questionId: "L04",
    data: {
      headline: "5월과 9월이 가장 유력해요.",
      tone: "good",
      confidence: 2,
      summary: ["올해는 인연이 들어오는 문이 두 번 열려요.", "서두르지 않고 새 모임에 한 곳만 나가 보세요."],
      months: ["normal", "careful", "normal", "normal", "good", "normal", "normal", "careful", "good", "normal", "normal", "normal"],
      evidence: [
        "일지(배우자궁)에 인연을 부르는 글자가 있어요.",
        "올해 세운에서 배우자성이 5월과 9월에 힘을 얻어요.",
        "용신 오행이 들어오는 달과 겹쳐요.",
      ],
      counter: "봄 두 달은 마음이 앞서 판단이 흐려질 수 있어요.",
      prescription: "이번 달에는 새로운 모임 한 곳에 나가 보세요.",
      nextQuestionIds: ["L10", "L11", "L12"],
    },
  },
  doryeong: {
    questionId: "J03",
    data: {
      headline: "올해는 버티는 쪽이 낫습니다.",
      tone: "careful",
      confidence: 3,
      summary: ["섣불리 옮기면 손해가 큰 해입니다.", "내년 봄까지는 자리를 지키며 준비하시지요."],
      months: ["normal", "normal", "careful", "careful", "normal", "normal", "normal", "careful", "normal", "good", "good", "normal"],
      evidence: [
        "월간에 정관이 자리를 잡고 있습니다.",
        "올해 세운이 이동수를 누르고 있습니다.",
        "용신 오행은 가을에 힘을 얻습니다.",
      ],
      counter: "8월에는 마음이 흔들릴 수 있으니 큰 결정은 미루시지요.",
      prescription: "이번 달에는 지금 하는 일의 성과를 한 줄씩 적어 두시지요.",
      nextQuestionIds: ["J04", "J05", "J06"],
    },
  },
  haechi: {
    questionId: "Y02",
    data: {
      headline: "5월이 으뜸이다. 8월은 조심하여라.",
      tone: "good",
      confidence: 2,
      summary: ["올해의 큰 흐름은 봄에 열리고 여름에 한 번 흔들린다.", "초가을부터 다시 길이 보이니 서두르지 말거라."],
      months: ["normal", "normal", "normal", "normal", "good", "normal", "normal", "careful", "normal", "good", "normal", "normal"],
      evidence: [
        "올해 세운이 일간을 도와준다.",
        "5월에 용신 오행이 들어온다.",
        "8월에는 충이 걸려 흐름이 꺾인다.",
      ],
      counter: "8월에는 말 한마디가 화를 부르니 입을 아끼거라.",
      prescription: "이번 달에는 하루에 한 가지씩만 끝내거라.",
      nextQuestionIds: ["Y01", "Y03", "Y04"],
    },
  },
};

// 판정 엔진(lib/verdict)이 아직 없어서 화면 확인용 샘플 결과를 쓴다. 엔진이 붙으면 이 함수만 바꾼다.
// 질문의 담당 풀이꾼에 맞는 말투의 샘플을 돌려준다. 문장은 샘플이라 질문과 내용이 다를 수 있다.
export function getVerdict(orderId: string, questionId?: string): Verdict | null {
  const q = getQuestion(questionId ?? SAMPLES.assi.questionId);
  if (!q) return null;
  const guide = guideOf(q);
  const s = SAMPLES[guide].data;
  return {
    orderId,
    questionId: q.id,
    guide,
    ...s,
    pillars: PILLARS,
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


