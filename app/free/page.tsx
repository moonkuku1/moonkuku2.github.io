import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { BottomBar } from "@/components/chrome";
import { FREE_TOOLS } from "@/lib/free-list";

export const metadata: Metadata = {
  title: "무료 풀이 · 사주300",
  description: "신살, 오행 분포, 일간, 띠 운세를 가입 없이 무료로 확인해요.",
  alternates: { canonical: "/free" },
};

export default function FreeIndexPage() {
  return (
    <div className="app-shell app-shell-wide">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-gold/20 bg-night/95 backdrop-blur">
        <BackButton label="이전 화면" />
        <h1 className="ml-1 font-serif text-lg font-bold">무료 풀이</h1>
      </header>
      <main className="px-4 pb-40 pt-5 lg:mx-auto lg:max-w-3xl lg:pb-16">
        <p className="text-sm text-text-sub">가입도 결제도 없이 바로 볼 수 있어요. 생년월일은 서버에 저장하지 않아요.</p>
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {FREE_TOOLS.map((t) => (
            <li key={t.slug}>
              <Link href={`/free/${t.slug}`} className="press lift flex h-full items-center gap-3 rounded-card border border-gold/30 bg-surface p-4">
                <span aria-hidden="true" className="text-2xl">{t.icon}</span>
                <span className="flex-1 text-sm">
                  <b className="block text-gold">{t.title}</b>
                  {t.desc}
                </span>
                <span aria-hidden="true" className="text-gold">›</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/" className="press mt-6 flex w-full items-center justify-center rounded-pill border border-gold/60 text-sm font-bold text-gold">
          내 사주 카드와 오늘 한 마디 받기
        </Link>
      </main>
      <BottomBar current="home" />
    </div>
  );
}
