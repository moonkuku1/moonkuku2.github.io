import published from "../data/q-published.json";
import questionsJson from "../data/questions.json";
import { SIGNAL_BY_KEY } from "./signals/library";
import { resolveRecipe } from "./verdict/recipes";

/**
 * 질문 소개 페이지(/q/[id]) 도우미.
 * 페이지는 모든 질문에 만들어 두지만, 검색에 보이게(색인) 하는 것은 사람이 검토해 `data/q-published.json`에 적은 질문뿐이다.
 * 검토 전 문장은 코드가 질문 데이터와 레시피에서 만든 설명이며, 개인 풀이가 아니다.
 */
const publishedIds = new Set(published as string[]);
export const isPublished = (id: string) => publishedIds.has(id);
export const publishedList = () => [...publishedIds];

type Raw = { id: string; sajuElements?: string[] };
const raw = questionsJson as Raw[];

/** 이 질문에서 사주의 어떤 요소를 보는지: 질문 데이터의 요소 + 레시피가 쓰는 신호 설명 */
export function readingPoints(id: string): { elements: string[]; signals: { label: string; plain: string }[]; consult: string | null } {
  const { recipe } = resolveRecipe(id);
  const seen = new Set<string>();
  const signals: { label: string; plain: string }[] = [];
  const plus = recipe.signals.filter((s) => s.dir === "+");
  for (const s of [...(plus.length > 0 ? plus : recipe.signals)].sort((a, b) => b.weight - a.weight)) {
    const def = SIGNAL_BY_KEY.get(s.key);
    if (!def || seen.has(def.label)) continue;
    seen.add(def.label);
    signals.push({ label: def.label, plain: def.plain });
    if (signals.length >= 4) break;
  }
  const consult = recipe.safety.find((x) => x.startsWith("consult:"))?.slice("consult:".length) ?? null;
  return { elements: raw.find((q) => q.id === id)?.sajuElements ?? [], signals, consult };
}
