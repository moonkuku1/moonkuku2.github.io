"use client";

import Link from "next/link";
import { useState } from "react";
import { AddButton, useCart } from "@/components/cart";
import { FACE } from "@/components/home/face";
import { bundleInfo } from "@/lib/pricing";
import { GUIDE_NAME, IMG, categories, getQuestion, guideOf, priceLabel, questionsOf, situations, sumPrice } from "@/lib/questions";

/**
 * 궁금한 주제 고르기: 주제 포스터 8장이 중심이고, 위에 "요즘 이런 고민" 칩 한 줄이 지름길로 붙는다.
 * 칩을 누르면 그 상황에 맞는 질문 3개가 바로 아래에 열리고, 한 번에 담을 수 있다.
 */
export function Topics() {
  const { ids, has, setMany } = useCart();
  const [open, setOpen] = useState<string | null>(null);
  const current = situations.find((s) => s.id === open);
  const list = current ? current.questionIds.map((id) => getQuestion(id)).filter((q): q is NonNullable<typeof q> => !!q) : [];
  const allIn = list.length > 0 && list.every((q) => has(q.id));

  return (
    <section id="categories" aria-labelledby="cat-title" className="scroll-mt-28 px-4 pt-10">
      <h2 id="cat-title" className="font-serif text-[21px] font-black">
        궁금한 주제 고르기
      </h2>

      {/* 요즘 이런 고민: 지름길 */}
      <p className="mt-2 text-sm text-text-sub">요즘 이런 고민이 있다면</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {situations.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              aria-pressed={open === s.id}
              aria-controls="situation-panel"
              onClick={() => setOpen(open === s.id ? null : s.id)}
              className={`press rounded-pill border px-4 text-sm ${open === s.id ? "border-gold bg-gold/15 text-gold" : "border-gold/30 text-text"}`}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div id="situation-panel" className="mt-3 rounded-card border border-gold/30 bg-surface p-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/category-art/art-${current.art}.png`} alt="" className="h-12 w-12 shrink-0 object-contain" />
            <p className="text-sm text-text-sub">{current.blurb}</p>
          </div>
          <ul className="mt-2 divide-y divide-gold/15">
            {list.map((q) => (
              <li key={q.id} className="flex items-center gap-2 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/characters/${FACE[guideOf(q)]}`} alt="" className="h-9 w-9 shrink-0 rounded-pill bg-surface-2 object-cover object-top" />
                <p className="flex-1 text-sm leading-snug">
                  {q.title}
                  <span className="price block text-xs text-text-sub">{q.price}원</span>
                </p>
                <AddButton id={q.id} title={q.title} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-pressed={allIn}
            onClick={() => setMany(list.map((q) => q.id), !allIn)}
            className={`press mt-2 w-full rounded-pill border text-sm font-bold ${allIn ? "border-gold bg-gold text-night" : "border-gold/60 text-gold"}`}
          >
            <span className="price">{allIn ? "담았어요 ✓ 모두 빼기" : `이 ${list.length}개 한 번에 담기 · ${sumPrice(list)}원`}</span>
          </button>
        </div>
      )}

      {/* 주제 포스터 */}
      <p className="mt-6 text-sm text-text-sub">주제를 누르면 질문 30개가 한 화면에 나와요.</p>
      <ul className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {categories.map((c) => {
          const qs = questionsOf(c.code);
          const sample = qs[0];
          const bundle = bundleInfo(c.code);
          const picked = ids.filter((id) => getQuestion(id)?.categoryCode === c.code).length;
          return (
            <li key={c.code} id={`cat-${c.code}`} className="scroll-mt-28">
              <Link
                href={`/c/${c.code}`}
                aria-label={`${c.name} 질문 ${qs.length}개 보기${picked ? `, ${picked}개 담음` : ""}`}
                className="press lift relative block aspect-[3/4] w-full overflow-hidden rounded-poster border border-gold/30 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/posters/poster-bg-${c.poster}.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/category-art/art-${c.poster}.png`} alt="" className="absolute left-1/2 top-[30%] h-[42%] w-[62%] -translate-x-1/2 object-contain" />
                <span className="absolute left-2 top-2 rounded-input border border-gold/60 bg-night/70 px-2 py-0.5 text-xs font-bold text-gold">{c.name}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${IMG}/characters/${FACE[c.guide]}`}
                  alt={`담당 ${GUIDE_NAME[c.guide]}`}
                  className="absolute right-2 top-2 h-9 w-9 rounded-pill border border-gold/50 bg-surface-2 object-cover object-top"
                />
                {picked > 0 && <span className="absolute right-2 top-12 rounded-pill bg-gold px-2 py-0.5 text-xs font-bold text-night">{picked}개 담음</span>}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/85 to-transparent p-3 pt-8">
                  <span className="block font-display text-lg leading-tight">{c.blurb}</span>
                  <span className="price mt-0.5 block text-xs text-text-sub">
                    {sample ? priceLabel(sample) : ""} · {qs.length}문항{bundle ? ` · 묶음 ${bundle.bundle.toLocaleString()}원` : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
