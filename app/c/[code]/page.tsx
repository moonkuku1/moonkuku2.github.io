import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { DISCLAIMER } from "@/components/home/rest";
import { Picker } from "@/components/picker";
import { IMG, categories, getCategory, getGuide, questionsOf } from "@/lib/questions";

type Props = { params: Promise<{ code: string }> };

export function generateStaticParams() {
  return categories.map((c) => ({ code: c.code }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const c = getCategory(code);
  return c ? { title: `${c.name} 질문 · 사주300`, description: `${c.name} 질문 30개를 한 화면에서 골라요.` } : {};
}

export default async function CategoryPage({ params }: Props) {
  const { code } = await params;
  const category = getCategory(code);
  if (!category) notFound();
  const list = questionsOf(code);
  const guide = getGuide(category.guide);

  return (
    <div className="app-shell app-shell-wide">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-gold/20 bg-night/95 backdrop-blur">
        <BackButton label="이전 화면" />
        <h1 className="ml-1 font-serif text-lg font-bold">{category.name} 질문</h1>
      </header>

      <main className="pb-28">
        {/* 담당 풀이꾼 소개 */}
        <section aria-label="담당 풀이꾼" className="relative mx-4 mt-4 overflow-hidden rounded-card border border-gold/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${IMG}/posters/poster-bg-${category.poster}.jpg`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="relative flex items-center gap-4 bg-gradient-to-r from-night/90 via-night/70 to-night/40 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${IMG}/characters/${guide.face}`}
              alt={`담당 ${guide.name}`}
              className="float motion h-20 w-20 shrink-0 rounded-pill border border-gold/50 bg-surface-2 object-cover object-top"
            />
            <div>
              <p className="text-xs text-gold">
                담당 {guide.name} · {guide.scope}
              </p>
              <p className="mt-1 font-display text-xl leading-snug">{guide.line}</p>
              <p className="mt-1 text-sm text-text-sub">
                {guide.role}. {category.blurb}.
              </p>
            </div>
          </div>
        </section>

        <Picker
          questions={list.map((q) => ({
            id: q.id,
            order: q.order,
            title: q.title,
            description: q.description,
            price: q.price,
            people: q.people,
            includesTiming: q.includesTiming,
          }))}
        />

        <p className="px-4 pt-8 text-xs leading-relaxed text-text-sub">{DISCLAIMER}</p>
      </main>
    </div>
  );
}
