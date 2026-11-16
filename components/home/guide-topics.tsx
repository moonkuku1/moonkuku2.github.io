"use client";
import Link from "next/link";
import { useState } from "react";
import { AddButton, useCart } from "@/components/cart";
import { FACE } from "@/components/home/face";
import { Slider } from "@/components/slider";
import { BANNER } from "@/lib/guide-art";
import { IMG, getQuestion, guideOf, guides, questionsOf, situations, sumPrice } from "@/lib/questions";

/**
 * 풀이꾼과 궁금한 주제: 풀이꾼 3명의 카드 안에 그 풀이꾼이 맡은 주제 포스터를 함께 둔다.
 * 위에는 "요즘 이런 고민" 칩 한 줄(누르면 질문 3개가 열리고 한 번에 담을 수 있다).
 * 휴대폰은 풀이꾼을 옆으로 넘기고, PC는 3명을 나란히 펼친다.
 */
export function GuideTopics() {
  const { has, setMany } = useCart();
  const [open, setOpen] = useState<string | null>(null);
  const current = situations.find((s) => s.id === open);
  const list = current ? current.questionIds.map((id) => getQuestion(id)).filter((q): q is NonNullable<typeof q> => !!q) : [];
  const allIn = list.length > 0 && list.every((q) => has(q.id));

  // 풀이꾼 3명: 큰 그림 카드. 누르면 그 풀이꾼의 주제 페이지(/g/아이디)로 간다.
  const cards = guides.map((g) => {
    const count = g.categories.reduce((n, code) => n + questionsOf(code).length, 0);
    return (
      <Link
        key={g.id}
        href={`/g/${g.id}`}
        aria-label={`${g.name}: ${g.scope}. 주제 보기`}
        className="press lift relative block aspect-[3/4] w-full overflow-hidden rounded-card border border-gold/30"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${IMG}/banners/${BANNER[g.id]}`} alt="" className="kenburns motion absolute inset-0 h-full w-full object-cover object-top" />
        <span className="absolute inset-x-0 bottom-0 flex h-[44%] flex-col justify-end bg-gradient-to-t from-night via-night/85 to-transparent p-4">
          <span className="text-xs font-bold text-gold">{g.scope}</span>
          <span className="font-serif text-2xl font-black leading-tight">{g.name}</span>
          <span className="mt-1 font-display text-base leading-snug">{g.line}</span>
          <span className="mt-2 flex items-center justify-between text-sm">
            <span className="text-text-sub">{count > 0 ? `질문 ${count}개` : "오늘 한 마디 · 올해 · 나"}</span>
            <span className="rounded-pill border border-gold/60 px-3 py-1 text-gold">주제 보기 ›</span>
          </span>
        </span>
      </Link>
    );
  });
  return (
    <section id="categories" aria-labelledby="gt-title" className="scroll-mt-28 pt-8">
      <div className="px-4">
        <h2 id="gt-title" className="font-serif text-[21px] font-black">풀이꾼과 궁금한 주제</h2>
        <p className="mt-1 text-sm text-text-sub">세 풀이꾼은 해치 삼백이가 둔갑한 얼굴이에요. 풀이꾼을 누르면 맡은 주제가, 주제를 누르면 질문이 나와요.</p>

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
