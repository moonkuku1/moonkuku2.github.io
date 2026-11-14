"use client";

import { useEffect, useState } from "react";
import { OPEN_KEY } from "@/components/chrome";
import { prefersReducedMotion } from "@/components/use-scroll-spy";
import { AddButton } from "@/components/cart";
import { FACE } from "@/components/home/face";
import { GUIDE_NAME, IMG, categories, priceLabel, questionsOf } from "@/lib/questions";

export function Categories() {
  const [open, setOpen] = useState<string | null>(null);
  const current = categories.find((c) => c.code === open);

  // 다른 화면에 갔다 돌아오면 펼쳐 둔 카테고리를 그대로 보여 준다.
  useEffect(() => {
    const saved = sessionStorage.getItem(OPEN_KEY);
    if (saved && categories.some((c) => c.code === saved)) setOpen(saved);
  }, []);

  function toggleCategory(code: string) {
    const next = open === code ? null : code;
    setOpen(next);
    if (next) {
      sessionStorage.setItem(OPEN_KEY, next);
      // 펼친 목록이 화면 밖이라 모를 수 있어서, 그 자리로 이동한다.
      setTimeout(() => {
        document.getElementById("cat-panel")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      }, 50);
    } else {
      sessionStorage.removeItem(OPEN_KEY);
    }
  }

  return (
    <section id="categories" aria-labelledby="cat-title" className="scroll-mt-28 px-4 pt-8">
      <h2 id="cat-title" className="font-serif text-[21px] font-black">
        고민별 질문
      </h2>
      <p className="mt-1 text-sm text-text-sub">포스터를 누르면 질문 30개가 펼쳐져요.</p>

      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {categories.map((c) => {
          const list = questionsOf(c.code);
          const sample = list[0];
          return (
            <li key={c.code} id={`cat-${c.code}`} className="scroll-mt-28">
              <button
                type="button"
                aria-expanded={open === c.code}
                aria-controls="cat-panel"
                onClick={() => toggleCategory(c.code)}
                className={`press relative block aspect-[3/4] w-full overflow-hidden rounded-poster border text-left ${
                  open === c.code ? "border-gold" : "border-gold/30"
                }`}
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
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/85 to-transparent p-3 pt-8">
                  <span className="block font-display text-lg leading-tight">{c.blurb}</span>
                  <span className="price mt-0.5 block text-xs text-text-sub">
                    {sample ? priceLabel(sample) : ""} · {list.length}문항
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {current && (
        <div id="cat-panel" className="mt-3 scroll-mt-28 rounded-card border border-gold/30 bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif text-lg font-bold text-gold">
              {current.name} 질문 · {GUIDE_NAME[current.guide]}
            </h3>
            <button
              type="button"
              onClick={() => toggleCategory(current.code)}
              className="press shrink-0 rounded-pill border border-gold/40 px-4 text-sm text-gold"
            >
              접기
            </button>
          </div>
          <ul className="mt-2 lg:grid lg:grid-cols-2 lg:gap-x-10">
            {questionsOf(current.code).map((q) => (
              <li key={q.id} className="flex items-center gap-2 border-b border-gold/15 py-2">
                <p className="flex-1 text-sm leading-snug">
                  {q.title}
                  <span className="price block text-xs text-text-sub">{q.people === 2 ? `두 사람 ${q.price}원` : `${q.price}원`}</span>
                </p>
                <AddButton id={q.id} title={q.title} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => { toggleCategory(current.code); document.getElementById("categories")?.scrollIntoView({ block: "start" }); }}
            className="press mt-2 w-full rounded-pill border border-gold/40 text-sm text-gold"
          >
            접기
          </button>
        </div>
      )}
    </section>
  );
}


