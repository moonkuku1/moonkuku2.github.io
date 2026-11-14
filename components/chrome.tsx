"use client";

import Link from "next/link";
import { useCart } from "@/components/cart";
import { IMG } from "@/lib/questions";

export const TABS = [
  { href: "#today", label: "오늘" },
  { href: "#situations", label: "이럴 때" },
  { href: "#categories", label: "고민별" },
  { href: "#guides", label: "풀이꾼" },
  { href: "#free", label: "무료" },
];

export function Header() {
  const { ids } = useCart();
  return (
    <header className="sticky top-0 z-30 border-b border-gold/20 bg-night/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="press flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${IMG}/logo/haechi-face.png`} alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-serif text-lg font-black text-gold">사주300</span>
        </Link>
        <a
          href="#cart"
          aria-label={`장바구니, 담은 질문 ${ids.length}개`}
          className="press relative flex h-11 w-11 items-center justify-center text-xl"
        >
          <span aria-hidden="true">🧺</span>
          {ids.length > 0 && (
            <span className="absolute right-0 top-1 flex h-5 min-w-5 items-center justify-center rounded-pill bg-gold px-1 text-xs font-bold text-night">
              {ids.length}
            </span>
          )}
        </a>
      </div>
      <nav aria-label="홈 구역" className="no-scrollbar flex overflow-x-auto px-2">
        {TABS.map((t, i) => (
          <a
            key={t.href}
            href={t.href}
            className={`press flex min-h-11 items-center px-4 text-sm font-medium ${
              i === 0 ? "border-b-2 border-gold text-gold" : "text-text-sub"
            }`}
          >
            {t.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export function BottomBar({ current = "home" }: { current?: "home" | "today" | "box" | "me" }) {
  const { ids, total } = useCart();
  const items = [
    { key: "home", href: "/", label: "홈", icon: "🏠" },
    { key: "today", href: "/#today", label: "오늘 한 마디", icon: "🌙" },
    { key: "box", href: "/#box", label: "내 풀이함", icon: "📜" },
    { key: "me", href: "/#me", label: "내 정보", icon: "🙂" },
  ] as const;
  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2">
      {ids.length > 0 && (
        <div
          id="cart"
          className="mx-3 mb-2 flex items-center justify-between gap-3 rounded-card border border-gold/40 bg-surface-2 py-2 pl-4 pr-2"
        >
          <p className="text-sm">
            담은 질문 {ids.length}개 · <span className="price font-bold text-gold">{total.toLocaleString()}원</span>
          </p>
          <button type="button" className="press rounded-pill bg-cta px-4 text-sm font-bold text-night">
            결제하고 바로 보기
          </button>
        </div>
      )}
      <nav aria-label="아래 메뉴" className="grid grid-cols-4 border-t border-gold/20 bg-night/95 backdrop-blur">
        {items.map((it) => (
          <Link
            key={it.key}
            href={it.href}
            aria-current={current === it.key ? "page" : undefined}
            className={`press flex min-h-14 flex-col items-center justify-center text-xs ${
              current === it.key ? "text-gold" : "text-text-sub"
            }`}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {it.icon}
            </span>
            {it.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
