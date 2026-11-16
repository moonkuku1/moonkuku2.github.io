import defaultsJson from "../../data/recipe-defaults.json";
import specificJson from "../../data/recipes.json";
import questionsJson from "../../data/questions.json";
import { SIGNAL_BY_KEY } from "../signals/library";
import type { Recipe, RuleSpec, SignalRef } from "./types";

type Question = { id: string; categoryCode: string; title: string; answerFormat: string; note: string };
const QUESTIONS = questionsJson as unknown as Question[];

type Defaults = {
  ruleByType: Record<string, RuleSpec>;
  needsPartnerCategories: string[];
  profileOnlyCategories: string[];
  timeKinds: string[];
  signalsByCategory: Record<string, SignalRef[]>;
};
const defaults = defaultsJson as unknown as Defaults;
const specific = specificJson as unknown as Record<string, Omit<Recipe, "id" | "source">>;

/** 레시피가 읽을 수 있는 신호만 쓰는지 검사한다(요구사항 5.6처럼 데이터가 틀리면 바로 오류로 알린다). */
function checkSignals(where: string, list: SignalRef[]) {
  if (list.length === 0) throw new Error(`${where}: 신호가 하나도 없어요`);
  const seen = new Set<string>();
  for (const s of list) {
    if (!SIGNAL_BY_KEY.has(s.key)) throw new Error(`${where}: 없는 신호예요 (${s.key})`);
    if (!(s.weight > 0)) throw new Error(`${where}: 가중치는 0보다 커야 해요 (${s.key})`);
    if (s.dir !== "+" && s.dir !== "-") throw new Error(`${where}: 방향은 + 또는 - 여야 해요 (${s.key})`);
    if (seen.has(s.key)) throw new Error(`${where}: 같은 신호를 두 번 썼어요 (${s.key})`);
    seen.add(s.key);
  }
}

/** 좋은 때가 아니라 조심할 때를 묻는 질문 제목 */
export const RISK_TITLE = /(조심해야 할|틀어질 수 있는|흔들리기 쉬운|갈등이 생기기|잃을 수 있는)/;

const ids = new Set(QUESTIONS.map((q) => q.id));
for (const [id, r] of Object.entries(specific)) {
  if (id.startsWith("_")) continue;
  if (!ids.has(id)) throw new Error(`recipes.json: 질문에 없는 ID예요 (${id})`);
  checkSignals(`recipes.json ${id}`, r.signals);
}
for (const [code, list] of Object.entries(defaults.signalsByCategory)) checkSignals(`recipe-defaults.json ${code}`, list);

/** 정교한 레시피가 있는 질문 ID들 */
export const SPECIFIC_RECIPE_IDS = Object.keys(specific).filter((k) => !k.startsWith("_"));

/** 질문 ID로 레시피를 찾는다. 질문별 레시피가 없으면 카테고리 공통 레시피(요구사항 5.5). */
export function resolveRecipe(questionId: string): { recipe: Recipe; question: Question } {
  const question = QUESTIONS.find((q) => q.id === questionId);
  if (!question) throw new Error(`없는 질문이에요: ${questionId}`);

  const own = specific[questionId];
  if (own) return { question, recipe: { ...own, id: questionId, source: "specific" } };

  const code = question.categoryCode;
  const rule: RuleSpec = defaults.needsPartnerCategories.includes(code) ? { kind: "needs-partner" } : defaults.ruleByType[question.answerFormat];
  if (!rule) throw new Error(`공통 레시피에 없는 답변 형식이에요: ${question.answerFormat} (${questionId})`);

  // 나(P)처럼 원국 중심 카테고리라도, 시기·판정 질문은 올해(Y)의 신호를 쓴다.
  const useYear = defaults.profileOnlyCategories.includes(code) && defaults.timeKinds.includes(rule.kind);
  const signals = defaults.signalsByCategory[useYear ? "Y" : code];
  if (!signals && rule.kind !== "needs-partner") throw new Error(`공통 레시피에 카테고리 ${code} 신호가 없어요`);

  // "조심해야 할 시기", "틀어질 수 있는 시기"처럼 나쁜 때를 찾는 질문은 신호의 방향을 뒤집어 위험한 때를 뽑는다
  const risk = RISK_TITLE.test(question.title) && (rule.kind === "timing-month" || rule.kind === "timing-year");
  const flip = (list: SignalRef[]) => list.map((s) => ({ ...s, dir: s.dir === "+" ? ("-" as const) : ("+" as const) }));
  return {
    question,
    recipe: {
      id: `default:${code}:${question.answerFormat}${risk ? ":risk" : ""}`,
      verdictType: question.answerFormat,
      signals: risk ? flip(signals ?? []) : (signals ?? []),
      rule,
      safety: [],
      risk,
      source: "default",
    },
  };
}

/** 모든 질문이 레시피를 갖는지 확인할 때 쓴다 */
export const ALL_QUESTION_IDS = QUESTIONS.map((q) => q.id);

