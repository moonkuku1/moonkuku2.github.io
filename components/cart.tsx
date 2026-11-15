"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { EventBody } from "@/lib/events";
import { cartTotals } from "@/lib/pricing";
import { getQuestion } from "@/lib/questions";
import { track } from "@/lib/track";

type CartValue = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string, source?: NonNullable<EventBody["props"]>["source"]) => void;
  /** 여러 질문을 한꺼번에 담거나 뺀다 */
  setMany: (ids: string[], on: boolean) => void;
  /** 실제로 내는 금액(묶음가 반영) */
  total: number;
  /** 낱개 합계 */
  listTotal: number;
  /** 묶음가로 아낀 금액 */
  saved: number;
};

const CartContext = createContext<CartValue | null>(null);
const KEY = "saju300-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  // 담은 질문은 이 브라우저에만 저장한다(개인정보 아님).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(saved)) setIds(saved.filter((x) => typeof x === "string" && getQuestion(x)));
    } catch {
      /* 저장값이 깨졌으면 빈 장바구니로 시작 */
    }
  }, []);

  // 최신 장바구니를 ref에도 담아 둔다: 빠르게 연속으로 눌러도 낡은 값으로 계산하지 않고, 이용 흐름 기록을 상태 계산 밖에서 보낸다
  const ref = useRef<string[]>([]);
  const commit = useCallback((next: string[]) => {
    ref.current = next;
    localStorage.setItem(KEY, JSON.stringify(next));
    setIds(next);
  }, []);
  useEffect(() => {
    ref.current = ids;
  }, [ids]);

  const toggle = useCallback(
    (id: string, source?: NonNullable<EventBody["props"]>["source"]) => {
      const prev = ref.current;
      const adding = !prev.includes(id);
      if (adding) track("cart_add", { questionId: id, source });
      commit(adding ? [...prev, id] : prev.filter((x) => x !== id));
    },
    [commit],
  );

  const setMany = useCallback(
    (targets: string[], on: boolean) => {
      const prev = ref.current;
      if (on) track("cart_add_many", { n: targets.length });
      commit(on ? [...prev, ...targets.filter((id) => !prev.includes(id))] : prev.filter((id) => !targets.includes(id)));
    },
    [commit],
  );
  const value = useMemo<CartValue>(
    () => ({
      ids,
      has: (id) => ids.includes(id),
      toggle,
      setMany,
      total: cartTotals(ids).pay,
      listTotal: cartTotals(ids).list,
      saved: cartTotals(ids).save,
    }),
    [ids, toggle, setMany],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("CartProvider 안에서만 쓸 수 있어요");
  return ctx;
}

/** 빈 동그라미 ‘+’ → 담기면 금색 채움 ‘✓’ */
export function AddButton({ id, title, source }: { id: string; title: string; source?: NonNullable<EventBody["props"]>["source"] }) {
  const { has, toggle } = useCart();
  const on = has(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${title} ${on ? "담기 취소" : "담기"}`}
      onClick={() => toggle(id, source)}
      className={`press flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border text-xl font-bold ${
        on ? "border-gold bg-gold text-night" : "border-gold/50 text-gold"
      }`}
    >
      <span aria-hidden="true">{on ? "✓" : "+"}</span>
    </button>
  );
}




