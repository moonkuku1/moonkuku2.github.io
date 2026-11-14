"use client";

import Link from "next/link";
import { useCart } from "@/components/cart";
import { FACE } from "@/components/home/face";
import { GUIDE_NAME, IMG, categories, getQuestion, priceLabel, questionsOf } from "@/lib/questions";

/** 궁금한 주제 고르기: 포스터를 누르면 그 주제의 질문 30개가 한 화면에 나온다(/c/코드). */
export function Categories() {
  const { ids } = useCart();

  return (
    <section id="categories" aria-labelledby="cat-title" className="scroll-mt-28 px-4 pt-8">
      <h2 id="cat-title" className="font-serif text-[21px] font-black">
        궁금한 주제 고르기
      </h2>
      <p className="mt-1 text-sm text-text-sub">주제를 누르면 질문 30개가 한 화면에 나와요.</p>

      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {categories.map((c) => {
          const list = questionsOf(c.code);
          const sample = list[0];
          const picked = ids.filter((id) => getQuestion(id)?.categoryCode === c.code).length;
          return (
            <li key={c.code} id={`cat-${c.code}`} className="scroll-mt-28">
              <Link
                href={`/c/${c.code}`}
                aria-label={`${c.name} 질문 ${list.length}개 보기${picked ? `, ${picked}개 담음` : ""}`}
                className="press lift relative block aspect-[3/4] w-full overflow-hidden rounded-poster border border-gold/30 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${IMG}/posters/poster-bg-${c.poster}.jpg`}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${IMG}/category-art/art-${c.poster}.png`}
                  alt=""
                  className="absolute left-1/2 top-[30%] h-[42%] w-[62%] -translate-x-1/2 object-contain"
                />
                <span className="absolute left-2 top-2 rounded-input border border-gold/60 bg-night/70 px-2 py-0.5 text-xs font-bold text-gold">
                  {c.name}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${IMG}/characters/${FACE[c.guide]}`}
                  alt={`담당 ${GUIDE_NAME[c.guide]}`}
                  className="absolute right-2 top-2 h-9 w-9 rounded-pill border border-gold/50 bg-surface-2 object-cover object-top"
                />
                {picked > 0 && (
                  <span className="absolute right-2 top-12 rounded-pill bg-gold px-2 py-0.5 text-xs font-bold text-night">
                    {picked}개 담음
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/85 to-transparent p-3 pt-8">
                  <span className="block font-display text-lg leading-tight">{c.blurb}</span>
                  <span className="price mt-0.5 block text-xs text-text-sub">
                    {sample ? priceLabel(sample) : ""} · {list.length}문항
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
