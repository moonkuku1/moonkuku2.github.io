import { buildContext } from "./signals/context";
import { SIGNAL_BY_KEY } from "./signals/library";
import type { Chart } from "./saju/chart";
import { categoryNameOf, guideOfQuestion, questionRow, type GuideId } from "./llm/guide";
import questionsJson from "../data/questions.json";

/**
 * "내 사주가 가장 궁금해할 질문 3개" (기준 문서 5장: 도화가 강하면 연애 질문을 위로).
 * 사주 원국과 올해의 신호를 주제별로 점수 내서, 점수가 높은 서로 다른 주제 3개에서 질문을 하나씩 고른다.
 * 점수는 코드가 정하고, 같은 사주와 같은 기준 연도면 항상 같은 결과다. 궁합(C)은 두 사람이 필요해서 넣지 않는다.
 */
export type Recommendation = {
  questionId: string;
  title: string;
  price: number;
  categoryCode: string;
  categoryName: string;
  guide: GuideId;
  /** 왜 이 질문이 떴는지(쉬운 말) */
  reason: string;
};

/** 신호가 켜졌을 때 어느 주제에 몇 점을 주고, 어떤 이유를 보여 줄지 */
const RULES: { signal: string; category: string; points: number; reason: string }[] = [
  { signal: "natalDohwa", category: "L", points: 2, reason: "사람을 끄는 매력(도화)이 사주에 있어요" },
  { signal: "natalSpouseStrong", category: "L", points: 1, reason: "인연을 뜻하는 기운이 뚜렷해요" },
  { signal: "yearSpouseStar", category: "L", points: 3, reason: "올해 인연을 뜻하는 기운이 들어와요" },
  { signal: "yearDohwa", category: "L", points: 1, reason: "올해 매력의 기운(도화)이 활발해요" },
  { signal: "natalDayBranchClashed", category: "L", points: 1, reason: "관계의 자리(일지)가 흔들리기 쉬운 짜임이에요" },

  { signal: "natalDayBranchCombined", category: "M", points: 2, reason: "관계의 자리(일지)가 합을 이루고 있어요" },
  { signal: "yearBranchCombinesDay", category: "M", points: 2, reason: "올해 관계의 자리와 합이 들어와요" },
  { signal: "luckSpouseStar", category: "M", points: 2, reason: "지금 10년 흐름에 인연의 기운이 있어요" },

  { signal: "natalWealthStrong", category: "W", points: 2, reason: "사주에 재물의 기운이 강해요" },
  { signal: "natalWealthAbsent", category: "W", points: 1, reason: "재물의 기운이 사주에 드러나 있지 않아요" },
  { signal: "yearWealth", category: "W", points: 3, reason: "올해 재물의 기운이 들어와요" },
  { signal: "luckWealth", category: "W", points: 1, reason: "지금 10년 흐름에 재물의 기운이 있어요" },

  { signal: "natalOfficerStrong", category: "J", points: 1, reason: "일과 책임의 기운이 강해요" },
  { signal: "yearOfficer", category: "J", points: 2, reason: "올해 일과 평가의 기운이 들어와요" },
  { signal: "yearYeokma", category: "J", points: 3, reason: "올해 이동·변화의 기운(역마)이 활발해요" },
  { signal: "natalYeokma", category: "J", points: 1, reason: "움직임의 기운(역마)이 사주에 있어요" },
  { signal: "yearPrint", category: "J", points: 1, reason: "올해 공부·도움의 기운이 들어와요" },

  { signal: "yearSamjae", category: "Y", points: 3, reason: "올해가 삼재라 흐름을 미리 보면 좋아요" },
  { signal: "yearHelpfulElement", category: "Y", points: 1, reason: "올해 도움이 되는 오행이 들어와요" },
  { signal: "yearAvoidElement", category: "Y", points: 2, reason: "올해 조심할 오행이 들어와요" },
  { signal: "yearBranchClashesDay", category: "Y", points: 2, reason: "올해 내 일지와 부딪히는 기운이 있어요" },

  { signal: "natalStrengthStrong", category: "P", points: 1, reason: "나를 돕는 기운이 강한 사주예요" },
  { signal: "natalStrengthWeak", category: "P", points: 1, reason: "나를 돕는 기운이 약한 사주예요" },

  { signal: "yearBranchClashesYear", category: "F", points: 3, reason: "올해 뿌리(연지)와 부딪히는 기운이 있어요" },
  { signal: "natalPrintStrong", category: "F", points: 1, reason: "도움과 보호의 기운이 많아요" },
];

/** 주제마다 먼저 권할 질문(정교한 레시피가 있는 질문부터). 같은 점수면 이 순서로 고른다. */
const PREFERRED: Record<string, string[]> = {
  L: ["L04", "L05", "L11"],
  M: ["M01", "M07"],
  W: ["W04", "W03"],
  J: ["J04", "J03", "J09"],
  Y: ["Y01", "Y02", "Y03"],
  P: ["P02", "P06"],
  F: ["F11", "F08"],
};
/** 점수가 같을 때의 주제 순서 */
const ORDER = ["L", "W", "J", "M", "Y", "P", "F"];
/** 아무 신호도 없을 때 기본으로 권하는 주제 */
const FALLBACK = ["Y", "L", "W"];

const exists = (id: string) => (questionsJson as { id: string }[]).some((q) => q.id === id);

export function recommendQuestions(chart: Chart, sajuYear: number, count = 3): Recommendation[] {
  const ctx = buildContext(chart, sajuYear);
  const score = new Map<string, number>(ORDER.map((c) => [c, 0]));
  const why = new Map<string, { points: number; reason: string }>();

  for (const r of RULES) {
    const def = SIGNAL_BY_KEY.get(r.signal);
    if (!def) throw new Error(`추천 규칙의 신호가 없어요: ${r.signal}`);
    if (!def.test(ctx)) continue;
    score.set(r.category, (score.get(r.category) ?? 0) + r.points);
    const best = why.get(r.category);
    if (!best || r.points > best.points) why.set(r.category, { points: r.points, reason: r.reason });
  }

  const ranked = [...ORDER].sort((a, b) => (score.get(b) ?? 0) - (score.get(a) ?? 0) || ORDER.indexOf(a) - ORDER.indexOf(b));
  const picked = ranked.filter((c) => (score.get(c) ?? 0) > 0).slice(0, count);
  // 신호가 모자라면 기본 주제로 채운다
  for (const c of FALLBACK) if (picked.length < count && !picked.includes(c)) picked.push(c);

  return picked.slice(0, count).map((code) => {
    const id = PREFERRED[code].find(exists) ?? "";
    const q = questionRow(id);
    const row = (questionsJson as { id: string; price: number }[]).find((x) => x.id === id)!;
    return {
      questionId: id,
      title: q.title,
      price: row.price,
      categoryCode: code,
      categoryName: categoryNameOf(code),
      guide: guideOfQuestion(id),
      reason: why.get(code)?.reason ?? "처음 보기 좋은 질문이에요",
    };
  });
}

