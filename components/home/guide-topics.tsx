"use client";
import Link from "next/link";
import { useState } from "react";
import { AddButton, useCart } from "@/components/cart";
import { FACE } from "@/components/home/face";
import { Slider } from "@/components/slider";
import { bundleInfo } from "@/lib/pricing";
import { IMG, getCategory, getQuestion, guideOf, guides, priceLabel, questionsOf, situations, sumPrice } from "@/lib/questions";

/**
 * 풀이꾼과 궁금한 주제: 풀이꾼 3명의 카드 안에 그 풀이꾼이 맡은 주제 포스터를 함께 둔다.
 * 위에는 "요즘 이런 고민" 칩 한 줄(누르면 질문 3개가 열리고 한 번에 담을 수 있다).
 * 휴대폰은 풀이꾼을 옆으로 넘기고, PC는 3명을 나란히 펼친다.
 */
export function GuideTopics() {
  const { ids, has, setMany } = useCart();
  const [open, setOpen] = useState<string | null>(null);
  const current = situations.find((s) => s.id === open);
  const list = current ? current.questionIds.map((id) => getQuestion(id)).filter((q): q is NonNullable<typeof q> => !!q) : [];
  const allIn = list.length > 0 && list.every((q) => has(q.id));

  const cards = guides.map((g) => {
    const cats = g.categories.map((code) => getCategory(code)).filter((c): c is NonNullable<typeof c> => !!c);
    return (
      <article key={g.id} aria-labelledby={`g-${g.id}`} className="flex h-full flex-col rounded-card border border-gold/30 bg-surface p-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${IMG}/characters/${g.face}`} alt={`${g.name} 얼굴`} className="float motion h-16 w-16 shrink-0 rounded-pill border border-gold/40 bg-surface-2 object-cover object-top" />
          <div className="min-w-0">
            <h3 id={`g-${g.id}`} className="font-serif text-lg font-bold">{g.name}</h3>
            <p className="text-xs text-gold">{g.scope}</p>
          </div>
        </div>
        <p className="mt-2 text-sm">{g.role}</p>
        <p className="mt-1 font-display text-base leading-snug">{g.line}</p>

        {cats.length > 0 ? (
          <ul className={`mt-3 grid gap-2 ${cats.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
            {cats.map((c) => {
              const qs = questionsOf(c.code);
              const bundle = bundleInfo(c.code);
              const picked = ids.filter((id) => getQuestion(id)?.categoryCode === c.code).length;
              return (
                <li key={c.code} id={`cat-${c.code}`} className="scroll-mt-28">
                  <Link
                    href={`/c/${c.code}`}
                    aria-label={`${c.name} 질문 ${qs.length}개 보기${picked ? `, ${picked}개 담음` : ""}`}
                    className="press lift relative block aspect-[4/3] w-full overflow-hidden rounded-poster border border-gold/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${IMG}/posters/poster-bg-${c.poster}.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${IMG}/category-art/art-${c.poster}.png`} alt="" className="absolute left-1/2 top-[8%] h-[55%] w-[60%] -translate-x-1/2 object-contain" />
                    <span className="absolute left-2 top-2 rounded-input border border-gold/60 bg-night/70 px-2 py-0.5 text-xs font-bold text-gold">{c.name}</span>
                    {picked > 0 && <span className="absolute right-2 top-2 rounded-pill bg-gold px-2 py-0.5 text-xs font-bold text-night">{picked}개 담음</span>}
                    <span className="price absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/85 to-transparent px-2 pb-2 pt-6 text-xs leading-tight text-text-sub">
                      {qs.length}문항{bundle ? ` · 묶음 ${bundle.bundle.toLocaleString()}원` : qs[0] ? ` · ${priceLabel(qs[0])}` : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 rounded-input border border-gold/20 bg-night/60 p-3 text-sm text-text-sub">주제별 질문은 아니고, 위 &lsquo;내 사주&rsquo;에서 오늘 한 마디를 무료로 받아요.</p>
        )}
      </article>
    );
  });

  return (
    <section id="categories" aria-labelledby="gt-title" className="scroll-mt-28 pt-8">
      <div className="px-4">
        <h2 id="gt-title" className="font-serif text-[21px] font-black">풀이꾼과 궁금한 주제</h2>
        <p className="mt-1 text-sm text-text-sub">세 풀이꾼은 해치 삼백이가 둔갑한 얼굴이에요. 맡은 주제를 누르면 질문 30개가 한 화면에 나와요.</p>

        <p className="mt-4 text-sm text-text-sub">요즘 이런 고민이 있다면</p>
        <ul className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {situations.map((s) => (
            <li key={s.id} className="shrink-0">
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
                  <AddButton id={q.id} title={q.title} source="chip" />
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
      </div>

      <div className="mt-4 lg:px-4">
        <Slider label="풀이꾼" items={cards} />
      </div>
    </section>
  );
}
