"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { cartTotals } from "@/lib/pricing";
import { getQuestion } from "@/lib/questions";

type CartValue = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
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

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setMany = useCallback((targets: string[], on: boolean) => {
    setIds((prev) => {
      const next = on ? [...prev, ...targets.filter((id) => !prev.includes(id))] : prev.filter((id) => !targets.includes(id));
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

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
export function AddButton({ id, title }: { id: string; title: string }) {
  const { has, toggle } = useCart();
  const on = has(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${title} ${on ? "담기 취소" : "담기"}`}
      onClick={() => toggle(id)}
      className={`press flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border text-xl font-bold ${
        on ? "border-gold bg-gold text-night" : "border-gold/50 text-gold"
      }`}
    >
      <span aria-hidden="true">{on ? "✓" : "+"}</span>
    </button>
  );
}


