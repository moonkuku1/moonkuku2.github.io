import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddButton } from "@/components/cart";
import { BackButton } from "@/components/back-button";
import { DISCLAIMER } from "@/components/home/rest";
import { BottomBar } from "@/components/chrome";
import { IMG, getCategory, getGuide, getQuestion, guideOf, questions, questionsOf } from "@/lib/questions";
import { isPublished, readingPoints } from "@/lib/q-pages";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return questions.map((q) => ({ id: q.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const q = getQuestion(id);
  if (!q) return {};
  const description = `${q.description}. 사주300이 이 질문을 사주에서 어떻게 보는지 설명해요. 하나에 ${q.price}원.`;
  return {
    title: `${q.title} · 사주300`,
    description,
    alternates: { canonical: `/q/${q.id}` },
    // 사람이 검토해 공개 목록에 올린 질문만 검색에 나온다
    robots: isPublished(q.id) ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function QuestionPage({ params }: Props) {
  const { id } = await params;
  const q = getQuestion(id);
  if (!q) notFound();
  const category = getCategory(q.categoryCode)!;
  const guide = getGuide(guideOf(q));
  const { elements, signals, consult } = readingPoints(q.id);
  const others = questionsOf(q.categoryCode).filter((x) => x.id !== q.id).slice(0, 4);
  const priceText = q.people === 2 ? `두 사람 ${q.price}원` : `하나에 ${q.price}원`;

  return (
    <div className="app-shell app-shell-wide">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-gold/20 bg-night/95 backdrop-blur">
        <BackButton label="이전 화면" />
        <p className="ml-1 text-sm text-gold">{category.name}</p>
      </header>
      <main className="px-4 pb-40 pt-5 lg:mx-auto lg:max-w-2xl lg:pb-16">
        <p className="text-xs font-bold text-gold">{category.name} · 담당 {guide.name}</p>
        <h1 className="mt-1 font-serif text-[26px] font-black leading-snug">{q.title}</h1>
        <p className="mt-2 text-sm text-text-sub">{q.description}</p>

        <section aria-labelledby="how" className="mt-6">
          <h2 id="how" className="font-serif text-[21px] font-black">사주에서는 이렇게 봐요</h2>
          <p className="mt-2 text-sm leading-relaxed">
            이 질문은 아래 요소를 계산해서 답해요. 계산은 코드가 하고, 풀이꾼은 그 결과를 문장으로 풀어 줘요.
          </p>
          {elements.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {elements.map((e) => (
                <li key={e} className="rounded-pill bg-surface-2 px-3 py-1 text-sm">{e}</li>
              ))}
            </ul>
          )}
          {signals.length > 0 && (
            <ul className="mt-3 divide-y divide-gold/15 rounded-card border border-gold/30 bg-surface px-4">
              {signals.map((s) => (
                <li key={s.label} className="py-3">
                  <p className="font-bold text-gold">{s.label}</p>
                  <p className="text-sm leading-snug">{s.plain}</p>
                </li>
              ))}
            </ul>
          )}
          {consult && <p className="mt-3 rounded-input border border-gold/20 bg-night/60 p-3 text-xs leading-relaxed text-text-sub">{consult} 관련 판단은 참고만 하시고, 전문가와 상담하세요.</p>}
        </section>

        <section aria-labelledby="get" className="mt-6">
          <h2 id="get" className="font-serif text-[21px] font-black">답은 이런 모양으로 받아요</h2>
          <ol className="mt-2 space-y-1 text-sm leading-relaxed">
            <li>1. 첫 줄에 결론</li>
            <li>2. 그렇게 본 근거 칩</li>
            <li>3. 확신도(강·중·약)와 반대 신호</li>
            <li>4. 이번 달에 할 일 하나</li>
          </ol>
          <p className="mt-2 text-sm text-text-sub">내 생년월일로 계산해서, 사람마다 다른 답이 나와요.</p>
        </section>

        <div className="mt-6 flex items-center justify-between gap-3 rounded-card border border-gold/30 bg-surface p-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/characters/${guide.face}`} alt="" className="h-10 w-10 rounded-pill bg-surface-2 object-cover object-top" />
            <p className="price text-sm">{priceText}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-sub">담기</span>
            <AddButton id={q.id} title={q.title} source="topic" />
          </div>
        </div>
        <Link href="/" className="press mt-3 flex w-full items-center justify-center rounded-pill border border-gold/60 text-sm font-bold text-gold">
          생년월일 넣고 무료 사주 카드부터 보기
        </Link>

        {others.length > 0 && (
          <section aria-labelledby="more" className="mt-8">
            <h2 id="more" className="font-serif text-[21px] font-black">같은 주제의 다른 질문</h2>
            <ul className="mt-2 divide-y divide-gold/15">
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/q/${o.id}`} className="press flex min-h-11 items-center py-2 text-sm">{o.title}</Link>
                </li>
              ))}
            </ul>
            <Link href={`/c/${category.code}`} className="press mt-2 flex items-center text-sm text-gold underline underline-offset-2">
              {category.name} 질문 {questionsOf(category.code).length}개 모두 보기
            </Link>
          </section>
        )}
        <p className="mt-8 text-xs leading-relaxed text-text-sub">{DISCLAIMER}</p>
      </main>
      <BottomBar current="home" />
    </div>
  );
}
