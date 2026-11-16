"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart";
import { SectionChips } from "@/components/section-chips";
import { prefersReducedMotion } from "@/components/use-scroll-spy";
import { IMG } from "@/lib/questions";

export const HOME_SECTIONS = [
  { id: "me", label: "내 사주" },
  { id: "categories", label: "풀이꾼·주제" },
  { id: "sample", label: "답변 예시" },
];

/** PC 위쪽 메뉴(휴대폰은 아래 메뉴를 쓴다) */
const TOP_LINKS = [
  { href: "/", label: "홈" },
  { href: "/g/assi", label: "삼백 아씨" },
  { href: "/g/doryeong", label: "삼백 도령" },
  { href: "/g/haechi", label: "해치 삼백이" },
  { href: "/free", label: "무료 풀이" },
];
export const SCROLL_KEY = "saju300-home-scroll";

export function Header() {
  const { ids } = useCart();
  const onHome = usePathname() === "/";

  function goHome() {
    // 로고를 누르면 처음부터 다시 본다(저장된 위치를 지운다).
    sessionStorage.removeItem(SCROLL_KEY);
    if (onHome) window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gold/20 bg-night/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" onClick={goHome} className="press flex items-center gap-2" aria-label="사주300 처음으로">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${IMG}/logo/haechi-face.png`} alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-serif text-lg font-black text-gold">사주300</span>
        </Link>
        <nav aria-label="위쪽 메뉴" className="hidden items-center gap-1 lg:flex">
          {TOP_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="press flex items-center rounded-pill px-3 text-sm text-text-sub hover:text-gold">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/cart"
          aria-label={`장바구니, 담은 질문 ${ids.length}개`}
          className="press relative flex h-11 w-11 items-center justify-center text-xl"
        >
          <span aria-hidden="true">🧺</span>
          {ids.length > 0 && (
            <span className="absolute right-0 top-1 flex h-5 min-w-5 items-center justify-center rounded-pill bg-gold px-1 text-xs font-bold text-night">
              {ids.length}
            </span>
          )}
        </Link>
      </div>
      <SectionChips sections={HOME_SECTIONS} />
    </header>
  );
}

export function BottomBar({ current = "home" }: { current?: "home" | "today" | "box" | "me" }) {
  const { ids, total } = useCart();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  const base = "press flex min-h-14 flex-col items-center justify-center text-xs";
  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2">
      {notice && (
        <p role="status" className="mx-auto mb-2 w-fit rounded-pill border border-gold/40 bg-surface-2 px-4 py-2 text-sm">
          {notice}
        </p>
      )}
      {ids.length > 0 && (
        <div
          id="cart"
          className="mx-3 mb-2 flex items-center justify-between gap-3 rounded-card border border-gold/40 bg-surface-2 py-2 pl-4 pr-2"
        >
          <p className="text-sm">
            담은 질문 {ids.length}개 · <span className="price font-bold text-gold">{total.toLocaleString()}원</span>
          </p>
          <Link href="/cart" className="press flex items-center rounded-pill bg-cta px-4 text-sm font-bold text-night">
            장바구니 보기
          </Link>
        </div>
      )}
      <nav aria-label="아래 메뉴" className="grid grid-cols-4 border-t lg:hidden border-gold/20 bg-night/95 backdrop-blur">
        <Link
          href="/"
          aria-current={current === "home" ? "page" : undefined}
          className={`${base} ${current === "home" ? "text-gold" : "text-text-sub"}`}
        >
          <span aria-hidden="true" className="text-lg leading-none">🏠</span>
          홈
        </Link>
        <Link href="/#me" className={`${base} text-text-sub`}>
          <span aria-hidden="true" className="text-lg leading-none">🌙</span>
          내 사주
        </Link>
        <button type="button" onClick={() => setNotice("내 풀이함은 준비 중이에요.")} className={`${base} text-text-sub`}>
          <span aria-hidden="true" className="text-lg leading-none">📜</span>
          내 풀이함
        </button>
        <button type="button" onClick={() => setNotice("내 정보는 준비 중이에요.")} className={`${base} text-text-sub`}>
          <span aria-hidden="true" className="text-lg leading-none">🙂</span>
          내 정보
        </button>
      </nav>
    </div>
  );
}



