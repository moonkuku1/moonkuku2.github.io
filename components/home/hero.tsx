"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BirthFields } from "@/components/birth-fields";
import { AddButton } from "@/components/cart";
import { Slider } from "@/components/slider";
import { FACE } from "@/components/home/face";
import { prefersReducedMotion } from "@/components/use-scroll-spy";
import { EMPTY_FORM as EMPTY, ME_KEY as KEY, birthBody, type Form } from "@/lib/birth-form";
import { shareImage } from "@/lib/share-client";
import type { ProfileCard } from "@/lib/profile-card";
import { IMG } from "@/lib/questions";
import { ELEMENT_COLOR } from "@/lib/result";
import { track } from "@/lib/track";

/**
 * 첫 화면: 생년월일 입력 하나 → 무료 사주 카드(명식표, 키워드, 삼백이의 오늘 한 마디, 내 사주가 궁금해할 질문 3개).
 * 생년월일은 서버에 저장하지 않는다. 이 탭에서만(sessionStorage) 잠깐 기억하고, 탭을 닫으면 지워진다.
 */

export function Hero() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [card, setCard] = useState<ProfileCard | null>(null);
  const [sample, setSample] = useState(true);
  const [editing, setEditing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [maxYear, setMaxYear] = useState(2026);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 탭에서 처음 열었을 때 한 번만 알린다
    if (!sessionStorage.getItem("saju300-seen")) {
      sessionStorage.setItem("saju300-seen", "1");
      track("home_view");
    }
    setMaxYear(new Date().getFullYear());
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
      if (saved?.form) setForm({ ...EMPTY, ...saved.form });
      if (saved?.card) {
        setCard(saved.card);
        setSample(saved.sample !== false);
        setEditing(false);
      }
    } catch {
      /* 저장값이 깨졌으면 새로 시작 */
    }
  }, []);


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.year || !form.month || !form.day) return setError("생년월일을 모두 골라 주세요.");
    if (!form.gender) return setError("성별을 골라 주세요. 대운의 방향이 달라져요.");
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(birthBody(form)),
      });      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "잠시 후 다시 시도해 주세요.");
      setCard(json.card);
      setSample(json.sample);
      setEditing(false);
      sessionStorage.setItem(KEY, JSON.stringify({ form, card: json.card, sample: json.sample }));
      track("card_created", { sample: json.sample });
      // 결과가 보이는 곳으로 부드럽게 이동하고, 읽어 주는 프로그램이 결과를 알 수 있게 포커스를 옮긴다
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
        resultRef.current?.focus({ preventScroll: true });
      }, 60);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveImage() {
    setShareError(null);
    setSharing(true);
    try {
      track("share_card");
      await shareImage("/api/share/card", birthBody(form), "saju300-내사주카드.png", "내 사주 카드");
    } catch (err) {
      setShareError((err as Error).message);
    } finally {
      setSharing(false);
    }
  }
  function forget() {
    sessionStorage.removeItem(KEY);
    setCard(null);
    setForm(EMPTY);
    setEditing(true);
    setError(null);
  }

  const summary = `${form.calendar === "lunar" ? `음력${form.leap ? " 윤달" : ""}` : "양력"} ${form.year}.${form.month}.${form.day} · ${form.gender === "male" ? "남" : "여"} · ${form.time ? form.time : "시간 모름"}`;

  return (
    <section id="me" aria-labelledby="hero-title" className="scroll-mt-28">
      <div className="lg:relative lg:isolate lg:min-h-[560px] lg:px-4 lg:py-8">
        {/* 배경 그림: 휴대폰은 위쪽 그림, PC는 화면 가득한 배경(글은 왼쪽 어두운 쪽에 놓는다) */}
        <div className="relative h-[250px] overflow-hidden lg:absolute lg:inset-y-0 lg:left-1/2 lg:-z-10 lg:h-auto lg:w-screen lg:-translate-x-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${IMG}/backgrounds/moonlit-canyon.webp`}
            alt=""
            aria-hidden="true"
            className="kenburns motion absolute inset-0 h-full w-full object-cover object-[78%_50%] lg:object-center"
          />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night to-transparent lg:h-40" />
        </div>

        <div className="relative -mt-14 px-4 lg:mt-0 lg:max-w-[540px] lg:px-0">
          <p className="text-xs font-bold text-gold">하나에 300원 · 결론부터</p>
          <h1 id="hero-title" className="mt-1 font-serif text-[28px] font-black leading-tight lg:text-[34px]">
            내 사주, 결론부터
            <br />
            말해 드려요
          </h1>
          <p className="mt-2 text-sm text-text-sub">생일만 넣으면 내 사주 카드와 삼백이의 오늘 한 마디를 무료로 보여 드려요.</p>

          {card && !editing ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-card border border-gold/30 bg-surface p-3">
              <p className="price text-sm">{summary}</p>
              <button type="button" onClick={() => setEditing(true)} className="press shrink-0 rounded-pill border border-gold/50 px-4 text-sm text-gold">
                수정
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 rounded-card border border-gold/30 bg-surface/95 p-4" noValidate>
              <BirthFields form={form} setForm={setForm} maxYear={maxYear} />

              {error && (
                <p role="alert" className="mt-3 rounded-input border border-seal bg-seal/15 p-3 text-sm">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy} className="press mt-3 w-full rounded-pill bg-gold py-3 font-bold text-night disabled:opacity-60">
                {busy ? "계산하고 있어요…" : "내 사주 무료로 보기"}
              </button>
              <p className="mt-2 text-xs leading-relaxed text-text-sub">생년월일은 서버에 저장하지 않아요. 이 탭에서만 잠깐 기억하고, 탭을 닫으면 지워져요.{" "}<Link href="/legal/privacy" className="underline underline-offset-2">개인정보 안내</Link></p>
            </form>
          )}
        </div>
      </div>

      {card && (
        <div ref={resultRef} tabIndex={-1} className="scroll-mt-28 pt-6 outline-none lg:px-4">
          <ProfileResult card={card} sample={sample} onReset={forget} onSave={saveImage} saving={sharing} saveError={shareError} />
        </div>
      )}
    </section>
  );
}

const ELEMENT_KO = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" } as const;

function ProfileResult({ card, sample, onReset, onSave, saving, saveError }: { card: ProfileCard; sample: boolean; onReset: () => void; onSave: () => void; saving: boolean; saveError: string | null }) {
  return (
    <Slider label="내 사주 결과" desktop="lg:grid lg:grid-cols-3 lg:items-start lg:gap-4" items={[
      /* 내 사주 카드 */
      <section key="card" aria-labelledby="my-card" className="h-full rounded-card border border-gold/30 bg-surface p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 id="my-card" className="font-serif text-[21px] font-black">
              내 사주 카드
            </h2>
            <p className="mt-0.5 text-sm text-gold">{card.dayPillar} · {card.dayStem} 일간</p>
          </div>
          <button type="button" onClick={onReset} className="press shrink-0 rounded-pill border border-gold/40 px-3 text-sm text-text-sub">
            다시 입력
          </button>
        </div>

        <p className="mt-3 font-display text-xl leading-snug">{card.profile.theme}</p>

        <div className={`mt-3 grid gap-2 text-center ${card.pillars.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
          {card.pillars.map((p) => (
            <div key={p.label}>
              <p className="mb-1 text-xs text-text-sub">{p.label}</p>
              {[p.stem, p.branch].map((c, i) => (
                <div
                  key={i}
                  role="img"
                  aria-label={`${p.label} ${i === 0 ? "천간" : "지지"} ${c.ch} ${c.label}`}
                  className={`mb-1 flex h-12 flex-col items-center justify-center rounded-input font-serif text-xl font-black ${c.element === "metal" ? "text-ink" : "text-hanji"}`}
                  style={{ backgroundColor: ELEMENT_COLOR[c.element], outline: c.element === "water" ? "1px solid rgba(217,180,106,.3)" : undefined }}
                >
                  {c.ch}
                  <span className="text-xs font-normal leading-none">{ELEMENT_KO[c.element]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <ul className="mt-2 flex flex-wrap gap-2 text-sm">
          <li className="rounded-pill bg-surface-2 px-3 py-1">{card.strength.level}</li>
          <li className="rounded-pill bg-surface-2 px-3 py-1">{card.structure}</li>
          {card.helpful.length > 0 && <li className="rounded-pill bg-good-bg px-3 py-1 text-hanji">도움이 되는 오행 {card.helpful.join("·")}</li>}
          {card.missing.length > 0 && <li className="rounded-pill bg-surface-2 px-3 py-1">부족한 오행 {card.missing.join("·")}</li>}
        </ul>

        <ul className="mt-3 divide-y divide-gold/15">
          {card.profile.keywords.map((k) => (
            <li key={k.word} className="py-2">
              <p className="font-bold text-gold">{k.word}</p>
              <p className="text-sm leading-snug">{k.line}</p>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onSave} disabled={saving} className="press mt-3 w-full rounded-pill border border-gold text-sm font-bold text-gold disabled:opacity-60">
          {saving ? "이미지를 만들고 있어요…" : "이미지로 저장·공유하기"}
        </button>
        {saveError && <p role="alert" className="mt-2 rounded-input border border-seal bg-seal/15 p-2 text-sm">{saveError}</p>}
        {sample && <p className="mt-2 text-xs text-text-sub">AI 연결 전이라 키워드 문장은 계산값으로 채운 샘플 문장이에요. 사주 글자와 분석 값은 실제 계산이에요.</p>}
        {card.notes.map((n) => (
          <p key={n} className="mt-2 rounded-input border border-gold/20 bg-night/60 p-2 text-xs leading-relaxed text-text-sub">
            {n}
          </p>
        ))}
      </section>,
        /* 삼백이의 오늘 한 마디 */
        <section key="today" aria-labelledby="today-title" className="hanji relative h-full rounded-card p-6">
          <h2 id="today-title" className="text-xs font-bold text-seal">
            삼백이의 오늘 한 마디
          </h2>
          <p className="mt-2 pr-16 font-display text-xl leading-snug">{card.today.line}</p>
          <p className="mt-3 text-xs text-ink/70">{card.today.basis}</p>
          <span aria-hidden="true" className="stamp-anim absolute right-5 top-5 flex h-14 w-14 items-center justify-center border-2 border-seal font-serif text-xl font-black text-seal">
            今日
          </span>
        </section>,
        /* 내 사주가 궁금해할 질문 3개 */
        <section key="rec" aria-labelledby="rec-title" className="h-full rounded-card border border-gold/30 bg-surface p-4">
          <h2 id="rec-title" className="font-serif text-[21px] font-black">
            내 사주가 궁금해할 질문 3개
          </h2>
          <ul className="mt-2 divide-y divide-gold/15">
            {card.recommendations.map((r) => (
              <li key={r.questionId} className="flex items-center gap-2 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/characters/${FACE[r.guide]}`} alt="" className="h-10 w-10 shrink-0 rounded-pill bg-surface-2 object-cover object-top" />
                <p className="flex-1 text-sm leading-snug">
                  <span className="block text-xs text-gold">{r.categoryName} · {r.reason}</span>
                  {r.title}
                  <span className="price block text-xs text-text-sub">하나에 {r.price}원</span>
                </p>
                <AddButton id={r.questionId} title={r.title} source="rec" />
              </li>
            ))}
          </ul>
        </section>,
    ]} />
  );
}





