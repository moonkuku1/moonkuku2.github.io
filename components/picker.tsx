"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AddButton, useCart } from "@/components/cart";

export type PickerQuestion = {
  id: string;
  order: number;
  title: string;
  description: string;
  price: number;
  people: number;
  includesTiming: boolean;
};

/** 한 주제의 질문 전체를 한 화면에 보여 주고, 전체 선택·해제와 시기 필터를 제공한다. */
export function Picker({ questions }: { questions: PickerQuestion[] }) {
  const { has, setMany, ids, total } = useCart();
  const [onlyTiming, setOnlyTiming] = useState(false);

  const shown = useMemo(() => (onlyTiming ? questions.filter((q) => q.includesTiming) : questions), [questions, onlyTiming]);
  const starter = questions.slice(0, 3);
  const pickedHere = questions.filter((q) => has(q.id));
  const hereTotal = pickedHere.reduce((s, q) => s + q.price, 0);
  const shownIds = shown.map((q) => q.id);
  const allShownIn = shownIds.length > 0 && shownIds.every((id) => has(id));
  const starterIn = starter.every((q) => has(q.id));

  const btn = "press rounded-pill border px-4 text-sm font-medium";

  return (
    <>
      {/* 처음이라면 */}
      <section aria-labelledby="starter" className="px-4 pt-5">
        <div className="rounded-card border border-gold/40 bg-surface-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id="starter" className="font-serif text-base font-bold text-gold">
              처음이라면 이 3개
              <span className="ml-2 text-xs font-medium text-text-sub">추천 질문</span>
            </h2>
            <button
              type="button"
              aria-pressed={starterIn}
              onClick={() => setMany(starter.map((q) => q.id), !starterIn)}
              className={`${btn} ${starterIn ? "border-gold bg-gold text-night" : "border-gold/60 text-gold"}`}
            >
              {starterIn ? "모두 빼기" : "3개 담기"}
            </button>
          </div>
          <ul className="mt-2 grid gap-x-8 lg:grid-cols-3">
            {starter.map((q) => (
              <li key={q.id} className="flex items-center gap-2 border-b border-gold/15 py-2">
                <p className="flex-1 text-sm leading-snug">{q.title}</p>
                <AddButton id={q.id} title={q.title} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 도구 줄 */}
      <section aria-label="질문 고르기 도구" className="sticky top-14 z-20 mt-5 border-y border-gold/20 bg-night/95 px-4 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm">
            이 주제에서 <b className="text-gold">{pickedHere.length}</b>/{questions.length}개 담음
          </p>
          <button
            type="button"
            aria-pressed={onlyTiming}
            onClick={() => setOnlyTiming((v) => !v)}
            className={`${btn} ${onlyTiming ? "border-gold bg-gold/15 text-gold" : "border-gold/30 text-text-sub"}`}
          >
            시기를 알려 주는 질문만
          </button>
          <button type="button" onClick={() => setMany(shownIds, true)} disabled={allShownIn} className={`${btn} border-gold/60 text-gold disabled:opacity-40`}>
            전체 선택 ({shown.length})
          </button>
          <button
            type="button"
            onClick={() => setMany(shownIds, false)}
            disabled={!shownIds.some((id) => has(id))}
            className={`${btn} border-gold/30 text-text-sub disabled:opacity-40`}
          >
            전체 해제
          </button>
        </div>
      </section>

      {/* 전체 질문 */}
      <section aria-label="질문 목록" className="px-4 pt-2">
        <ul className="lg:grid lg:grid-cols-2 lg:gap-x-10">
          {shown.map((q) => (
            <li key={q.id} className="flex items-center gap-3 border-b border-gold/15 py-3">
              <span className="price w-6 shrink-0 text-center text-xs text-text-sub">{q.order}</span>
              <p className="flex-1 leading-snug">
                {q.title}
                <span className="mt-0.5 block text-sm text-text-sub">{q.description}</span>
                <span className="price mt-0.5 block text-xs text-gold">
                  {q.people === 2 ? `두 사람 ${q.price}원` : `${q.price}원`}
                  {q.includesTiming && " · 시기를 알려 줘요"}
                </span>
              </p>
              <AddButton id={q.id} title={q.title} />
            </li>
          ))}
        </ul>
        {shown.length === 0 && <p className="py-8 text-center text-text-sub">조건에 맞는 질문이 없어요.</p>}
      </section>

      {/* 아래 고정 요약 */}
      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-gold/30 bg-night/95 p-3 backdrop-blur lg:max-w-[1200px]">
        <div className="flex items-center gap-3">
          <p className="price flex-1 text-sm leading-snug">
            {ids.length === 0 ? (
              "질문 옆 ‘+’를 눌러 담아 보세요."
            ) : (
              <>
                이 주제 {pickedHere.length}개 · {hereTotal.toLocaleString()}원
                <span className="block text-xs text-text-sub">
                  장바구니 전체 {ids.length}개 · {total.toLocaleString()}원
                </span>
              </>
            )}
          </p>
          <Link
            href="/cart"
            className={`press flex items-center rounded-pill px-5 text-sm font-bold ${
              ids.length === 0 ? "pointer-events-none bg-surface-2 text-text-sub" : "bg-cta text-night"
            }`}
            aria-disabled={ids.length === 0}
            tabIndex={ids.length === 0 ? -1 : 0}
          >
            장바구니 보기
          </Link>
        </div>
      </div>
    </>
  );
}
