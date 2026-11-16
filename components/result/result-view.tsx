"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddButton } from "@/components/cart";
import { BackButton } from "@/components/back-button";
import { FACE } from "@/components/home/face";
import { DISCLAIMER } from "@/components/home/rest";
import { ResultBottom } from "@/components/result/bottom";
import { Seal } from "@/components/result/seal";
import { SectionChips } from "@/components/section-chips";
import { DEMO_FORM, birthBody, savedForm, type Form } from "@/lib/birth-form";
import { IMG } from "@/lib/questions";
import { ELEMENT_COLOR } from "@/lib/result";
import type { ResultPayload } from "@/lib/result-service";

const CONF = { 강: 3, 중: 2, 약: 1 } as const;
const SECTIONS = [
  { id: "sec-verdict", label: "판정" },
  { id: "sec-why", label: "근거" },
  { id: "sec-honest", label: "솔직히" },
  { id: "sec-rx", label: "처방" },
  { id: "sec-next", label: "이어서" },
];
const SECTIONS_WITH_MONTHS = [SECTIONS[0], { id: "sec-months", label: "시기" }, ...SECTIONS.slice(1)];
const ELEMENT_KO = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" } as const;

type State = { kind: "loading" } | { kind: "need-birth" } | { kind: "error"; message: string; refund: boolean } | { kind: "done"; data: ResultPayload };

export function ResultView({ questionId, demo }: { questionId: string; demo: boolean }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [form, setForm] = useState<Form | null>(null);

  useEffect(() => {
    const f = demo ? DEMO_FORM : savedForm();
    if (!f) return setState({ kind: "need-birth" });
    setForm(f);
    const ctl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/answer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...birthBody(f), questionId }),
          signal: ctl.signal,
        });
        const json = await res.json();
        if (!res.ok) return setState({ kind: "error", message: json.error ?? "잠시 후 다시 시도해 주세요.", refund: !!json.refund });
        if (json.status === "needs-partner") return setState({ kind: "error", message: json.message ?? "궁합은 두 사람의 정보가 필요해요.", refund: false });
        setState({ kind: "done", data: json });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setState({ kind: "error", message: "연결이 불안정해요. 잠시 후 다시 시도해 주세요.", refund: false });
      }
    })();
    return () => ctl.abort();
  }, [questionId, demo]);

  const header = (chips: boolean, months: boolean) => (
    <header className="sticky top-0 z-30 border-b border-gold/20 bg-night/95 backdrop-blur">
      <div className="flex h-14 items-center">
        <BackButton label="이전 화면" />
      </div>
      {chips && <SectionChips sections={months ? SECTIONS_WITH_MONTHS : SECTIONS} />}
    </header>
  );

  if (state.kind !== "done") {
    return (
      <div className="app-shell">
        {header(false, false)}
        <main className="px-4 pt-16 text-center">
          {state.kind === "loading" && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/characters/haechi-think.png`} alt="" className="float motion mx-auto h-28 w-28 object-contain" />
              <p role="status" className="mt-4 font-display text-xl">풀이꾼이 풀이를 쓰고 있어요…</p>
              <p className="mt-1 text-sm text-text-sub">보통 몇 초 안에 끝나요.</p>
            </>
          )}
          {state.kind === "need-birth" && (
            <>
              <p className="font-display text-xl">생년월일을 먼저 알려 주세요.</p>
              <p className="mt-1 text-sm text-text-sub">홈에서 한 번 입력하면 이 탭에서는 다시 묻지 않아요. 입력값은 탭을 닫으면 지워져요.</p>
              <Link href="/#me" className="press mt-6 inline-flex items-center rounded-pill bg-gold px-6 font-bold text-night">
                내 사주 입력하러 가기
              </Link>
            </>
          )}
          {state.kind === "error" && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/characters/haechi-think.png`} alt="" className="mx-auto h-28 w-28 object-contain" />
              <p role="alert" className="mt-4 font-display text-xl">{state.message}</p>
              {state.refund && <p className="mt-2 text-sm text-text-sub">풀이가 만들어지지 않아 결제 금액은 환불 대상으로 기록돼요.</p>}
              <Link href="/" className="press mt-6 inline-flex items-center rounded-pill border border-gold px-6 text-gold">
                홈으로
              </Link>
            </>
          )}
        </main>
      </div>
    );
  }

  const d = state.data;
  const a = d.answer;
  const mood = d.tone === "good" ? "joy" : "think";
  const conf = CONF[d.confidence];
  const hasMonths = !!d.flow;

  return (
    <div className="app-shell">
      {header(true, hasMonths)}
      <main className="pb-40">
        {/* 풀이꾼 장면 */}
        <section aria-label="풀이꾼 장면" className="relative h-[300px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${IMG}/guides/guide-${d.guide}.jpg`} alt="" className="kenburns motion absolute inset-0 h-full w-full object-cover object-top" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/90 to-transparent p-4 pt-14">
            <p className="text-xs font-bold text-gold">
              {d.guideName}의 풀이 · {d.categoryName}
            </p>
            <h1 className="font-serif text-lg font-bold leading-snug">{d.title}</h1>
            {demo && <p className="mt-1 text-xs text-text-sub">견본 사주(2000년생)로 보여 드리는 화면이에요</p>}
          </div>
        </section>

        {/* 판정 카드 */}
        <section id="sec-verdict" aria-labelledby="verdict" className="scroll-mt-28 px-4 pt-3">
          <div className="hanji relative rounded-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`inline-block rounded-pill px-3 py-0.5 text-xs font-bold ${d.tone === "good" ? "bg-good-bg text-good" : "bg-seal/15 text-seal"}`}>
                  {d.tone === "good" ? "좋은 흐름" : "조심할 흐름"}
                </span>
                <h2 id="verdict" className="mt-2 font-serif text-[24px] font-black leading-snug">
                  {a.headline}
                </h2>
              </div>
              <Seal />
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm">
              확신도
              <span role="img" aria-label={`확신도 ${d.confidence}`} className="flex gap-1">
                {[1, 2, 3].map((n) => (
                  <span key={n} className={`h-2.5 w-6 rounded-pill ${n <= conf ? "bg-seal" : "bg-ink/20"}`} />
                ))}
              </span>
              <b>{d.confidence}</b>
            </p>
            {a.story.split(/\n+/).map((p) => (
              <p key={p} className="mt-3 text-sm leading-relaxed">
                {p}
              </p>
            ))}
            {a.confidenceNote && <p className="mt-3 border-t border-ink/15 pt-3 text-xs text-ink/70">{a.confidenceNote}</p>}
          </div>
        </section>

        {/* 12달 */}
        {d.flow && (
          <section id="sec-months" aria-labelledby="months" className="scroll-mt-28 px-4 pt-8">
            <h2 id="months" className="font-serif text-[21px] font-black">
              {d.risk ? "조심할 달은 언제일까" : "언제가 좋을까"}
            </h2>
            <ol className="mt-3 grid grid-cols-12 items-end gap-1 rounded-card border border-gold/20 bg-surface p-3">
              {d.flow.map((m) => (
                <li key={m.label} className="flex flex-col items-center gap-1">
                  <span className="h-4 text-xs leading-4 text-gold" aria-hidden="true">
                    {m.flow === "good" ? "★" : ""}
                  </span>
                  <span className={`block w-full rounded-t-sm ${m.flow === "good" ? "h-16 bg-gold" : m.flow === "careful" ? "h-10 bg-seal" : "h-6 bg-surface-2"}`} />
                  <span className="text-xs text-text-sub">{m.month}</span>
                  <span className="sr-only">
                    {m.label} {m.flow === "good" ? "좋은 달" : m.flow === "careful" ? "조심할 달" : "보통"}
                  </span>
                </li>
              ))}
            </ol>
            {a.months && (
              <ul className="mt-3 space-y-1 text-sm">
                {a.months.map((m) => (
                  <li key={m.month} className="flex gap-2">
                    <span className="price w-16 shrink-0 text-text-sub">{m.month.slice(5)}월</span>
                    <span>{m.line}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* 근거 */}
        <section id="sec-why" aria-labelledby="why" className="scroll-mt-28 px-4 pt-8">
          <h2 id="why" className="font-serif text-[21px] font-black">
            이렇게 본 근거
          </h2>
          <div className="mt-3 rounded-card border border-gold/20 bg-surface p-4">
            <div className={`grid gap-2 text-center ${d.pillars.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
              {d.pillars.map((p) => (
                <div key={p.label}>
                  <p className="mb-1 text-xs text-text-sub">{p.label}</p>
                  {[
                    { c: p.stem, used: p.usedStem, kind: "천간" },
                    { c: p.branch, used: p.usedBranch, kind: "지지" },
                  ].map(({ c, used, kind }) => (
                    <div
                      key={kind}
                      role="img"
                      aria-label={`${p.label} ${kind} ${c.ch} ${ELEMENT_KO[c.element]}${used ? ", 판정에 쓴 글자" : ""}`}
                      className={`mb-1 flex h-12 flex-col items-center justify-center rounded-input border-2 font-serif text-xl font-black ${used ? "border-gold" : "border-transparent"} ${c.element === "metal" ? "text-ink" : "text-hanji"}`}
                      style={{ backgroundColor: ELEMENT_COLOR[c.element], outline: c.element === "water" ? "1px solid rgba(217,180,106,.3)" : undefined }}
                    >
                      {c.ch}
                      <span className="text-xs font-normal leading-none">{ELEMENT_KO[c.element]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-text-sub">금색 테두리는 이번 판정에 쓴 글자예요.</p>
            {a.evidence.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {a.evidence.map((e) => (
                  <li key={e.chip} className="rounded-input bg-surface-2 px-3 py-2 text-sm">
                    <b className="text-gold">{e.chip}</b>
                    <span className="mt-0.5 block">{e.why}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-text-sub">이 판정을 직접 받쳐 주는 계산값이 많지 않아요.</p>
            )}
          </div>
        </section>

        {/* 솔직히 */}
        <section id="sec-honest" aria-labelledby="honest" className="scroll-mt-28 px-4 pt-8">
          <div className="rounded-card border border-seal bg-seal/15 p-4">
            <h2 id="honest" className="text-sm font-bold text-gold">
              솔직히 말하면
            </h2>
            <p className="mt-1 text-sm">{a.counter || "이번 판정에 반대로 작용하는 신호는 눈에 띄지 않아요."}</p>
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
            <div>
              <p className="font-display text-xl leading-snug">{a.action.do}</p>
              <p className="mt-1 text-sm text-gold">{a.action.by}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-text-sub">
            <b className="text-text">피할 것</b> · {a.avoid}
          </p>
        </section>

        {/* 이어서 */}
        <section id="sec-next" aria-labelledby="next" className="scroll-mt-28 px-4 pt-8">
          <h2 id="next" className="font-serif text-[21px] font-black">
            이어서 물어보기
          </h2>
          <ul className="mt-3 divide-y divide-gold/15 rounded-card border border-gold/20 bg-surface px-4">
            {d.next.map((n) => (
              <li key={n.questionId} className="flex items-center gap-2 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/characters/${FACE[d.guide]}`} alt={`${d.guideName} 얼굴`} className="h-9 w-9 shrink-0 rounded-pill bg-surface-2 object-cover object-top" />
                <p className="flex-1 text-sm leading-snug">
                  {n.title}
                  <span className="price block text-xs text-text-sub">{n.price}원</span>
                </p>
                <AddButton id={n.questionId} title={n.title} source="result" />
              </li>
            ))}
          </ul>
        </section>

        {d.sample && (
          <p className="mx-4 mt-8 rounded-input border border-gold/30 bg-surface p-3 text-sm text-text-sub">
            AI 연결 전이라 풀이 문장은 계산값으로 채운 샘플 문장이에요. 판정, 시기, 확신도, 근거는 실제 계산이에요.
          </p>
        )}
        {d.safety.consult.length > 0 && (
          <p className="mx-4 mt-3 rounded-input border border-gold/30 bg-surface p-3 text-sm text-text-sub">
            {d.safety.consult.join("·")} 관련 판단은 사주만으로 정하지 말고 전문가와 함께 확인해 주세요.
          </p>
        )}
        <p className="px-4 pt-4 text-xs leading-relaxed text-text-sub">{DISCLAIMER}</p>
      </main>
      {form && <ResultBottom body={{ ...birthBody(form), questionId }} />}
    </div>
  );
}
