"use client";
import Link from "next/link";
import { useCart } from "@/components/cart";
import { FACE } from "@/components/home/face";
import { bundleInfo } from "@/lib/pricing";
import { GUIDE_NAME, IMG, getQuestion, priceLabel, questionsOf, type Category } from "@/lib/questions";

/** 주제 포스터 한 장. 눌러서 그 주제의 질문 30개 화면(/c/코드)으로 간다. 담은 개수를 배지로 보여 준다. */
export function CategoryPoster({ c, ratio = "aspect-[3/4]", showGuide = true }: { c: Category; ratio?: string; showGuide?: boolean }) {
  const { ids } = useCart();
  const qs = questionsOf(c.code);
  const bundle = bundleInfo(c.code);
  const picked = ids.filter((id) => getQuestion(id)?.categoryCode === c.code).length;
  return (
    <Link
      href={`/c/${c.code}`}
      aria-label={`${c.name} 질문 ${qs.length}개 보기${picked ? `, ${picked}개 담음` : ""}`}
      className={`press lift relative block w-full overflow-hidden rounded-poster border border-gold/30 text-left ${ratio}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${IMG}/posters/poster-bg-${c.poster}.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${IMG}/category-art/art-${c.poster}.png`} alt="" className="absolute left-1/2 top-[22%] h-[44%] w-[64%] -translate-x-1/2 object-contain" />
      <span className="absolute left-2 top-2 rounded-input border border-gold/60 bg-night/70 px-2 py-0.5 text-xs font-bold text-gold">{c.name}</span>
      {showGuide && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${IMG}/characters/${FACE[c.guide]}`} alt={`담당 ${GUIDE_NAME[c.guide]}`} className="absolute right-2 top-2 h-9 w-9 rounded-pill border border-gold/50 bg-surface-2 object-cover object-top" />
      )}
      {picked > 0 && <span className="absolute right-2 top-12 rounded-pill bg-gold px-2 py-0.5 text-xs font-bold text-night">{picked}개 담음</span>}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/85 to-transparent p-3 pt-8">
        <span className="block font-display text-lg leading-tight">{c.blurb}</span>
        <span className="price mt-0.5 block text-xs text-text-sub">
          {qs[0] ? priceLabel(qs[0]) : ""} · {qs.length}문항{bundle ? ` · 묶음 ${bundle.bundle.toLocaleString()}원` : ""}
        </span>
      </span>
    </Link>
  );
}
