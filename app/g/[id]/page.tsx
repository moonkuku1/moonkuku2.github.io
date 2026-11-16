import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { BottomBar } from "@/components/chrome";
import { CategoryPoster } from "@/components/home/poster";
import { DISCLAIMER } from "@/components/home/rest";
import { BANNER } from "@/lib/guide-art";
import { IMG, getCategory, guides, questionsOf, type Guide } from "@/lib/questions";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return guides.map((g) => ({ id: g.id }));
}

const find = (id: string) => guides.find((g) => g.id === id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const g = find(id);
  return g ? { title: `${g.name} · 사주300`, description: `${g.name}이 맡은 주제: ${g.scope}. ${g.role}.` } : {};
}

export default async function GuidePage({ params }: Props) {
  const { id } = await params;
  const g = find(id);
  if (!g) notFound();
  const cats = g.categories.map((code) => getCategory(code)).filter((c): c is NonNullable<typeof c> => !!c);
  const count = cats.reduce((n, c) => n + questionsOf(c.code).length, 0);

  return (
    <div className="app-shell app-shell-wide">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-gold/20 bg-night/95 backdrop-blur">
        <BackButton label="이전 화면" />
        <h1 className="ml-1 font-serif text-lg font-bold">{g.name}</h1>
      </header>
      <main className="pb-40 lg:pb-16">
        {/* 풀이꾼 장면 */}
        <section aria-label={`${g.name} 소개`} className="relative h-[340px] overflow-hidden lg:mx-4 lg:mt-4 lg:h-[380px] lg:rounded-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${IMG}/${BANNER[g.id as Guide]}`} alt="" className="kenburns motion absolute inset-0 h-full w-full object-cover object-top" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-xs font-bold text-gold">{g.scope}</p>
            <h2 className="font-serif text-[28px] font-black leading-tight">{g.name}</h2>
            <p className="mt-1 font-display text-xl leading-snug">{g.line}</p>
            <p className="mt-1 text-sm text-text-sub">{g.role}{count > 0 ? ` · 담당 질문 ${count}개` : ""}</p>
          </div>
        </section>

        {cats.length > 0 && (
          <section aria-labelledby="g-cats" className="px-4 pt-6">
            <h2 id="g-cats" className="font-serif text-[21px] font-black">맡은 주제</h2>
            <p className="mt-1 text-sm text-text-sub">주제를 누르면 질문 30개가 한 화면에 나와요.</p>
            <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {cats.map((c) => (
                <li key={c.code}>
                  <CategoryPoster c={c} showGuide={false} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {g.id === "haechi" && (
          <section aria-labelledby="g-today" className="px-4 pt-6">
            <div className="hanji relative rounded-card p-6">
              <h2 id="g-today" className="text-xs font-bold text-seal">삼백이의 오늘 한 마디</h2>
              <p className="mt-2 font-display text-xl leading-snug">오늘의 한 줄은 그냥 주마. 생일만 알려 다오.</p>
              <Link href="/#me" className="press mt-3 flex w-full items-center justify-center rounded-pill bg-gold font-bold text-night">
                생일 넣고 무료로 받기
              </Link>
            </div>
          </section>
        )}

        <section aria-label="다른 풀이꾼" className="px-4 pt-6">
          <ul className="flex flex-wrap gap-2">
            {guides.filter((x) => x.id !== g.id).map((x) => (
              <li key={x.id}>
                <Link href={`/g/${x.id}`} className="press flex items-center rounded-pill border border-gold/50 px-4 text-sm text-gold">
                  {x.name} 만나기
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <p className="mt-8 px-4 text-xs leading-relaxed text-text-sub">{DISCLAIMER}</p>
      </main>
      <BottomBar current="home" />
    </div>
  );
}
