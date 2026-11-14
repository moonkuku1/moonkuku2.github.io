"use client";

import { AddButton, useCart } from "@/components/cart";
import { IMG, getQuestion, situations, sumPrice } from "@/lib/questions";

/**
 * 요즘 이런 고민 있어요: 질문 문장은 접어 두고, 상황 하나에 질문 3개를 한 번에 담는 지름길만 보여 준다.
 * 질문 문장은 주제 페이지(/c/..)에서 처음부터 보인다.
 */
export function Situations() {
  const { has, setMany } = useCart();

  return (
    <section id="situations" aria-labelledby="sit-title" className="scroll-mt-28 pt-8">
      <h2 id="sit-title" className="px-4 font-serif text-[21px] font-black">
        요즘 이런 고민 있어요
      </h2>
      <p className="mt-1 px-4 text-sm text-text-sub">비슷한 상황을 고르면 어울리는 질문 3개를 한 번에 담아 드려요.</p>
      <ul className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto px-4 lg:mx-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-5">
        {situations.map((s) => {
          const list = s.questionIds.map((id) => getQuestion(id)).filter((q) => !!q);
          if (list.length === 0) return null;
          const allIn = list.every((q) => has(q!.id));
          const price = sumPrice(list as NonNullable<(typeof list)[number]>[]);
          return (
            <li
              key={s.id}
              className="flex w-[78%] shrink-0 snap-start flex-col rounded-card border border-gold/30 bg-surface p-4 lg:w-auto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/category-art/art-${s.art}.png`} alt="" className="h-16 w-16 object-contain" />
              <h3 className="mt-2 font-serif text-base font-bold leading-snug">{s.title}</h3>
              <p className="mt-1 text-sm text-text-sub">{s.blurb}</p>

              <button
                type="button"
                aria-pressed={allIn}
                onClick={() => setMany(list.map((q) => q!.id), !allIn)}
                className={`press mt-3 w-full rounded-pill border text-sm font-bold ${
                  allIn ? "border-gold bg-gold text-night" : "border-gold/60 text-gold"
                }`}
              >
                <span className="price">
                  {allIn ? `담았어요 ✓ 모두 빼기` : `이 ${list.length}개 한 번에 담기 · ${price}원`}
                </span>
              </button>

              <details className="mt-2">
                <summary className="press flex cursor-pointer items-center text-sm text-text-sub">
                  질문 {list.length}개 보기
                </summary>
                <ul className="mt-1 divide-y divide-gold/15">
                  {list.map((q) => (
                    <li key={q!.id} className="flex items-center gap-2 py-2">
                      <p className="flex-1 text-sm leading-snug">
                        {q!.title}
                        <span className="price block text-xs text-text-sub">{q!.price}원</span>
                      </p>
                      <AddButton id={q!.id} title={q!.title} />
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
