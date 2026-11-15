import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { AddButton } from "@/components/cart";
import { SectionChips } from "@/components/section-chips";
import { FACE } from "@/components/home/face";
import { DISCLAIMER } from "@/components/home/rest";
import { ResultBottom } from "@/components/result/bottom";
import { Seal } from "@/components/result/seal";
import { CONFIDENCE_LABEL, ELEMENT_COLOR, ELEMENT_NAME, getVerdict } from "@/lib/result";
import { GUIDE_NAME, IMG, getCategory, getQuestion } from "@/lib/questions";

const RESULT_SECTIONS = [
  { id: "sec-verdict", label: "판정" },
  { id: "sec-months", label: "시기" },
  { id: "sec-why", label: "근거" },
  { id: "sec-honest", label: "솔직히" },
  { id: "sec-rx", label: "처방" },
  { id: "sec-next", label: "이어서" },
];

type Props = { params: Promise<{ orderId: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  const v = getVerdict(orderId);
  if (!v) return {};
  const img = `/api/share/og?order=${encodeURIComponent(orderId)}`;
  return {
    title: `${v.headline} · 사주300`,
    openGraph: { title: v.headline, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [img] },
  };
}

export default async function ResultPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { q } = await searchParams;
  const v = getVerdict(orderId, q);
  if (!v) notFound();
  const question = getQuestion(v.questionId)!;
  const category = getCategory(question.categoryCode);
  const mood = v.tone === "good" ? "joy" : "think";
  const guideFile = `guide-${v.guide}.jpg`;

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-30 border-b border-gold/20 bg-night/95 backdrop-blur">
        <div className="flex h-14 items-center">
          <BackButton label="이전 화면" />
        </div>
        <SectionChips sections={RESULT_SECTIONS} />
      </header>

      <main className="pb-40">
        {/* 풀이꾼 장면 */}
        <section aria-label="풀이꾼 장면" className="relative h-[300px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${IMG}/guides/${guideFile}`} alt="" className="kenburns motion absolute inset-0 h-full w-full object-cover object-top" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/90 to-transparent p-4 pt-14">
            <p className="text-xs font-bold text-gold">
              {GUIDE_NAME[v.guide]}의 풀이 · {category?.name}
            </p>
            <h1 className="font-serif text-lg font-bold leading-snug">{question.title}</h1>
            <p className="mt-1 text-xs text-text-sub">{v.birthLabel}</p>
          </div>
        </section>

        {/* 판정 카드 */}
        <section id="sec-verdict" aria-labelledby="verdict" className="scroll-mt-28 px-4 pt-3">
          <div className="hanji relative rounded-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-block rounded-pill px-3 py-0.5 text-xs font-bold ${
                    v.tone === "good" ? "bg-good-bg text-good" : "bg-seal/15 text-seal"
                  }`}
                >
                  {v.tone === "good" ? "좋은 흐름" : "조심할 흐름"}
                </span>
                <h2 id="verdict" className="mt-2 font-serif text-[24px] font-black leading-snug">
                  {v.headline}
                </h2>
              </div>
              <Seal />
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm">
              확신도
              <span role="img" aria-label={`확신도 ${CONFIDENCE_LABEL[v.confidence]}`} className="flex gap-1">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={`h-2.5 w-6 rounded-pill ${n <= v.confidence ? "bg-seal" : "bg-ink/20"}`}
                  />
                ))}
              </span>
              <b>{CONFIDENCE_LABEL[v.confidence]}</b>
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              {v.summary[0]}
              <br />
              {v.summary[1]}
            </p>
          </div>
        </section>

        {/* 12달 */}
        <section id="sec-months" aria-labelledby="months" className="scroll-mt-28 px-4 pt-8">
          <h2 id="months" className="font-serif text-[21px] font-black">
            언제가 좋을까
          </h2>
          <ol className="mt-3 grid grid-cols-12 items-end gap-1 rounded-card border border-gold/20 bg-surface p-3">
            {v.months.map((f, i) => (
              <li key={i} className="flex flex-col items-center gap-1">
                <span className="h-4 text-xs leading-4 text-gold" aria-hidden="true">
                  {f === "good" ? "★" : ""}
                </span>
                <span
                  className={`block w-full rounded-t-sm ${
                    f === "good" ? "h-16 bg-gold" : f === "careful" ? "h-10 bg-seal" : "h-6 bg-surface-2"
                  }`}
                />
                <span className="text-xs text-text-sub">{i + 1}</span>
                <span className="sr-only">
                  {i + 1}월 {f === "good" ? "좋은 달" : f === "careful" ? "조심할 달" : "보통"}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* 근거 */}
        <section id="sec-why" aria-labelledby="why" className="scroll-mt-28 px-4 pt-8">
          <h2 id="why" className="font-serif text-[21px] font-black">
            이렇게 본 근거
          </h2>
          <div className="mt-3 rounded-card border border-gold/20 bg-surface p-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              {v.pillars.map((p) => (
                <div key={p.label}>
                  <p className="mb-1 text-xs text-text-sub">{p.label}</p>
                  {[
                    { ch: p.stem, el: p.stemEl, used: p.usedStem },
                    { ch: p.branch, el: p.branchEl, used: p.usedBranch },
                  ].map((c, i) => (
                    <div
                      key={i}
                      className={`mb-1 flex h-12 flex-col items-center justify-center rounded-input border-2 font-serif text-xl font-black ${
                        c.used ? "border-gold" : "border-transparent"
                      } ${c.el === "metal" ? "text-ink" : "text-hanji"}`}
                      style={{ backgroundColor: ELEMENT_COLOR[c.el], outline: c.el === "water" ? "1px solid rgba(217,180,106,.3)" : undefined }}
                    >
                      {c.ch}
                      <span className="text-[10px] font-normal leading-none">{ELEMENT_NAME[c.el]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-text-sub">금색 테두리는 이번 판정에 쓴 글자예요.</p>
            <ul className="mt-3 space-y-2">
              {v.evidence.map((e) => (
                <li key={e} className="rounded-input bg-surface-2 px-3 py-2 text-sm">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 솔직히 */}
        <section id="sec-honest" aria-labelledby="honest" className="scroll-mt-28 px-4 pt-8">
          <div className="rounded-card border border-seal bg-seal/15 p-4">
            <h2 id="honest" className="text-sm font-bold text-gold">
              솔직히 말하면
            </h2>
            <p className="mt-1 text-sm">{v.counter}</p>
          </div>
        </section>

        {/* 처방 */}
        <section id="sec-rx" aria-labelledby="rx" className="scroll-mt-28 px-4 pt-8">
          <h2 id="rx" className="font-serif text-[21px] font-black">
            이번 달 처방
          </h2>
          <div className="mt-3 flex items-center gap-3 rounded-card border border-gold/30 bg-surface p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/characters/haechi-${mood}.png`} alt="" className="float motion h-20 w-20 shrink-0 object-contain" />
            <p className="font-display text-xl leading-snug">{v.prescription}</p>
          </div>
        </section>

        {/* 이어서 */}
        <section id="sec-next" aria-labelledby="next" className="scroll-mt-28 px-4 pt-8">
          <h2 id="next" className="font-serif text-[21px] font-black">
            이어서 물어보기
          </h2>
          <ul className="mt-3 divide-y divide-gold/15 rounded-card border border-gold/20 bg-surface px-4">
            {v.nextQuestionIds.map((id) => {
              const nq = getQuestion(id);
              if (!nq) return null;
              return (
                <li key={id} className="flex items-center gap-2 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${IMG}/characters/${FACE[v.guide]}`}
                    alt={`${GUIDE_NAME[v.guide]} 얼굴`}
                    className="h-9 w-9 shrink-0 rounded-pill bg-surface-2 object-cover object-top"
                  />
                  <p className="flex-1 text-sm leading-snug">
                    {nq.title}
                    <span className="price block text-xs text-text-sub">{nq.price}원</span>
                  </p>
                  <AddButton id={nq.id} title={nq.title} source="result" />
                </li>
              );
            })}
          </ul>
        </section>

        {orderId === "sample" && (
          <p className="mx-4 mt-8 rounded-input border border-gold/30 bg-surface p-3 text-sm text-text-sub">
            샘플 결과예요. 풀이꾼 말투를 보여 드리려고 만든 예시 문장이에요. ({question.id} 담당: {GUIDE_NAME[v.guide]})
          </p>
        )}
        <p className="px-4 pt-4 text-xs leading-relaxed text-text-sub">{DISCLAIMER}</p>
      </main>
      <ResultBottom orderId={orderId} />
    </div>
  );
}





