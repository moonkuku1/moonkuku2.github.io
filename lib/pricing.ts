import pricingJson from "@/data/pricing.json";
import { categories, getQuestion, questionsOf, sumPrice, type Question } from "@/lib/questions";

type Pricing = {
  bundle: { default: number; byCategory: Record<string, number> };
  minPayment: number;
};

const pricing = pricingJson as Pricing;

/** 주제의 묶음가. 없으면 null. */
export function bundlePriceOf(code: string): number | null {
  const v = pricing.bundle.byCategory[code] ?? pricing.bundle.default;
  return typeof v === "number" && v > 0 ? v : null;
}

// 데이터 검사(요구사항 6.2): 묶음가가 정가(낱개 합계) 이상이면 빌드할 때 오류로 알린다.
for (const c of categories) {
  const bundle = bundlePriceOf(c.code);
  const list = questionsOf(c.code);
  if (bundle !== null && list.length > 0 && bundle >= sumPrice(list)) {
    throw new Error(`pricing.json: ${c.name} 묶음가(${bundle}원)가 정가(${sumPrice(list)}원) 이상이에요.`);
  }
}

export type CategoryPrice = {
  count: number;
  /** 낱개 합계 */
  list: number;
  /** 실제로 내는 금액 */
  pay: number;
  /** 묶음가가 적용됐는지 */
  bundled: boolean;
};

/** 한 주제에서 고른 질문들의 가격. 주제의 질문을 모두 골랐으면 묶음가를 쓴다. */
export function priceOfCategory(code: string, picked: Question[]): CategoryPrice {
  const list = sumPrice(picked);
  const all = questionsOf(code);
  const bundle = bundlePriceOf(code);
  const complete = all.length > 0 && all.every((q) => picked.some((p) => p.id === q.id));
  const bundled = complete && bundle !== null;
  return { count: picked.length, list, pay: bundled ? (bundle as number) : list, bundled };
}

/** 이 주제를 모두 담았을 때의 묶음 정보(안내 문구용) */
export function bundleInfo(code: string) {
  const bundle = bundlePriceOf(code);
  const all = questionsOf(code);
  if (bundle === null || all.length === 0) return null;
  const list = sumPrice(all);
  return { count: all.length, list, bundle, save: list - bundle, percent: Math.round(((list - bundle) / list) * 100) };
}

/** 장바구니 전체 금액 */
export function cartTotals(ids: string[]) {
  let list = 0;
  let pay = 0;
  for (const c of categories) {
    const picked = ids.map((id) => getQuestion(id)).filter((q): q is Question => !!q && q.categoryCode === c.code);
    if (picked.length === 0) continue;
    const p = priceOfCategory(c.code, picked);
    list += p.list;
    pay += p.pay;
  }
  return { list, pay, save: list - pay };
}

export const MIN_PAYMENT = pricing.minPayment;
