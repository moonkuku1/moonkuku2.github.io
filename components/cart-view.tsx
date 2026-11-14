"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddButton, useCart } from "@/components/cart";
import { FACE } from "@/components/home/face";
import { DISCLAIMER } from "@/components/home/rest";
import { IMG, categories, getCategory, getQuestion, guideOf, questionsOf, sumPrice, type Question } from "@/lib/questions";

export function CartView() {
  const { ids, total, setMany } = useCart();
  const [open, setOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [agreeAdult, setAgreeAdult] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // 저장된 장바구니를 읽은 뒤에 보여 준다(빈 화면이 잠깐 번쩍이는 것을 막는다).
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const picked = ids.map((id) => getQuestion(id)).filter((q): q is Question => !!q);
  const groups = categories
    .map((c) => ({ c, list: picked.filter((q) => q.categoryCode === c.code).sort((a, b) => a.order - b.order) }))
    .filter((g) => g.list.length > 0);

  // 함께 보면 좋은 질문: 담은 주제에서 아직 안 담은 앞쪽 질문 3개
  const suggestions: Question[] = [];
  for (const g of groups) {
    const rest = questionsOf(g.c.code).filter((q) => !ids.includes(q.id)).slice(0, 2);
    for (const q of rest) if (suggestions.length < 3) suggestions.push(q);
  }

  if (!ready) return <div className="min-h-[60vh]" />;

  if (picked.length === 0) {
    return (
      <div className="px-4 pt-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${IMG}/characters/haechi-think.png`} alt="" className="float motion mx-auto h-32 w-32 object-contain" />
        <p className="mt-4 font-display text-xl">아직 담은 질문이 없구나.</p>
        <p className="mt-1 text-sm text-text-sub">궁금한 주제를 골라 질문을 담아 보세요.</p>
        <Link href="/#categories" className="press mt-6 inline-flex items-center rounded-pill bg-cta px-6 font-bold text-night">
          질문 고르러 가기
        </Link>
      </div>
    );
  }

  const canPay = agreeRefund && agreeAdult;

  return (
    <div className="px-4 pb-16 pt-4">
      {/* 주제별 요약 */}
      <section aria-labelledby="sum-title">
        <h2 id="sum-title" className="font-serif text-[21px] font-black">
          담은 질문
        </h2>
        <ul className="mt-3 space-y-2">
          {groups.map(({ c, list }) => {
            const isOpen = open === c.code;
            const all = questionsOf(c.code);
            const rows = isOpen && showAll ? all : list;
            return (
              <li key={c.code} className="overflow-hidden rounded-card border border-gold/30 bg-surface">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpen(isOpen ? null : c.code);
                    setShowAll(false);
                  }}
                  className="press flex min-h-14 w-full items-center gap-3 px-4 text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${IMG}/characters/${FACE[c.guide]}`}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-pill bg-surface-2 object-cover object-top"
                  />
                  <span className="flex-1 font-bold">{c.name}</span>
                  <span className="price text-sm">
                    {list.length}개 · <b className="text-gold">{sumPrice(list).toLocaleString()}원</b>
                  </span>
                  <span aria-hidden="true" className="text-gold">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-gold/20 px-4 pb-3">
                    <div className="flex items-center justify-between py-2">
                      <p className="text-xs text-text-sub">
                        {showAll ? `전체 ${all.length}문항 중 ${list.length}개 선택` : "선택한 질문만 보는 중"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAll((v) => !v)}
                        className="press rounded-pill border border-gold/40 px-3 text-sm text-gold"
                      >
                        {showAll ? "선택한 것만 보기" : `전체 ${all.length}문항 보기`}
                      </button>
                    </div>
                    <ul>
                      {rows.map((q) => {
                        const on = ids.includes(q.id);
                        return (
                          <li key={q.id} className="flex items-center gap-2 border-b border-gold/15 py-2">
                            <p className={`flex-1 text-sm leading-snug ${on ? "" : "text-text-sub"}`}>
                              {on && <span className="mr-1 text-gold">✓</span>}
                              {q.title}
                              <span className="price block text-xs text-text-sub">
                                {q.people === 2 ? `두 사람 ${q.price}원` : `${q.price}원`}
                              </span>
                            </p>
                            <AddButton id={q.id} title={q.title} />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex items-center justify-between rounded-card bg-surface-2 px-4 py-3">
          <p className="price">
            총 <b>{picked.length}</b>개
          </p>
          <p className="price text-lg font-bold text-gold">{total.toLocaleString()}원</p>
        </div>
        <button
          type="button"
          onClick={() => setMany(ids, false)}
          className="press mt-1 flex items-center px-1 text-sm text-text-sub underline"
        >
          장바구니 비우기
        </button>
      </section>

      {/* 함께 보면 좋은 질문 */}
      {suggestions.length > 0 && (
        <section aria-labelledby="with-title" className="mt-8">
          <h2 id="with-title" className="font-serif text-[21px] font-black">
            함께 보면 좋은 질문
          </h2>
          <ul className="mt-3 divide-y divide-gold/15 rounded-card border border-gold/20 bg-surface px-4">
            {suggestions.map((q) => (
              <li key={q.id} className="flex items-center gap-2 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${IMG}/characters/${FACE[guideOf(q)]}`}
                  alt={`${getCategory(q.categoryCode)?.name} 담당 얼굴`}
                  className="h-9 w-9 shrink-0 rounded-pill bg-surface-2 object-cover object-top"
                />
                <p className="flex-1 text-sm leading-snug">
                  {q.title}
                  <span className="price block text-xs text-text-sub">{q.price}원</span>
                </p>
                <AddButton id={q.id} title={q.title} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 결제 전 확인 */}
      <section aria-labelledby="pay-title" className="mt-8">
        <h2 id="pay-title" className="font-serif text-[21px] font-black">
          결제 전 확인
        </h2>
        <div className="mt-3 space-y-1 rounded-card border border-gold/20 bg-surface p-4">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={agreeRefund}
              onChange={(e) => setAgreeRefund(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-gold)]"
            />
            결과 생성이 시작되면 환불이 제한된다는 안내를 확인했어요.
          </label>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={agreeAdult}
              onChange={(e) => setAgreeAdult(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-gold)]"
            />
            만 19세 이상이에요.
          </label>
        </div>
        <button
          type="button"
          disabled={!canPay}
          onClick={() => setNotice("지금은 테스트 단계라 실제 결제는 되지 않아요. 결제 연결은 준비 중이에요.")}
          className="press mt-3 w-full rounded-pill bg-cta py-3 font-bold text-night disabled:opacity-40"
        >
          <span className="price">{total.toLocaleString()}원 결제하고 바로 보기</span>
        </button>
        {!canPay && <p className="mt-2 text-xs text-text-sub">두 가지를 모두 확인하면 결제 버튼이 켜져요.</p>}
        {notice && (
          <p role="status" className="mt-3 rounded-input border border-gold/40 bg-surface-2 p-3 text-sm">
            {notice}
          </p>
        )}
      </section>

      <p className="pt-8 text-xs leading-relaxed text-text-sub">{DISCLAIMER}</p>
    </div>
  );
}

