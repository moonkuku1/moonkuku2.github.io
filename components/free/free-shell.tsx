"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BirthFields } from "@/components/birth-fields";
import { EMPTY_FORM, ME_KEY, birthBody, type Form } from "@/lib/birth-form";
import type { CardPillar } from "@/lib/profile-card";
import { ELEMENT_COLOR } from "@/lib/result";
import { track } from "@/lib/track";
import type { EventName } from "@/lib/events";

const ELEMENT_KO = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" } as const;

/** 사주 여덟 글자 표(오행 색). 무료 풀이 결과 위쪽에 공통으로 쓴다. */
export function PillarGrid({ pillars, mark }: { pillars: CardPillar[]; mark?: string }) {
  return (
    <div className={`grid gap-2 text-center ${pillars.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
      {pillars.map((p) => (
        <div key={p.label}>
          <p className="mb-1 text-xs text-text-sub">{p.label}</p>
          {[p.stem, p.branch].map((c, i) => (
            <div
              key={i}
              role="img"
              aria-label={`${p.label} ${i === 0 ? "천간" : "지지"} ${c.ch} ${c.label}`}
              className={`mb-1 flex h-12 flex-col items-center justify-center rounded-input font-serif text-xl font-black ${c.element === "metal" ? "text-ink" : "text-hanji"}`}
              style={{ backgroundColor: ELEMENT_COLOR[c.element], outline: mark && p.label === "일주" && i === 0 ? "2px solid var(--color-gold)" : undefined }}
            >
              {c.ch}
              <span className="text-xs font-normal leading-none">{ELEMENT_KO[c.element]}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export const TIME_UNKNOWN_NOTE = "태어난 시간을 몰라 시주 없이 계산했어요. 시주에 있는 내용은 빠져 있을 수 있어요.";

/**
 * 무료 풀이 공통 틀: 생년월일 입력 → API 호출 → 결과 그리기.
 * 입력값은 이 탭에서만(sessionStorage) 기억하고 서버에는 요청 본문으로만 보낸다.
 * 성별을 묻지 않는 풀이(일간·띠)는 서버가 요구하는 칸만 채워 보내며, 그 값은 결과에 쓰이지 않는다.
 */
export function FreeShell<T>({
  endpoint,
  event,
  button,
  idPrefix,
  showTime = true,
  showGender = true,
  render,
}: {
  endpoint: string;
  event: EventName;
  button: string;
  idPrefix: string;
  showTime?: boolean;
  showGender?: boolean;
  render: (result: T) => React.ReactNode;
}) {
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [maxYear, setMaxYear] = useState(2026);
  const [result, setResult] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMaxYear(new Date().getFullYear());
    try {
      const saved = JSON.parse(sessionStorage.getItem(ME_KEY) ?? "null");
      if (saved?.form) setForm({ ...EMPTY_FORM, ...saved.form });
    } catch {
      /* 저장값이 깨졌으면 새로 시작 */
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.year || !form.month || !form.day) return setError("생년월일을 모두 골라 주세요.");
    if (showGender && !form.gender) return setError("성별을 골라 주세요.");
    const body = birthBody({ ...form, time: showTime ? form.time : "", gender: form.gender || "female" });
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "잠시 후 다시 시도해 주세요.");
      setResult(json.result);
      track(event);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} noValidate className="rounded-card border border-gold/30 bg-surface/95 p-4">
        <BirthFields form={form} setForm={setForm} maxYear={maxYear} idPrefix={idPrefix} showTime={showTime} showGender={showGender} />
        {error && (
          <p role="alert" className="mt-3 rounded-input border border-seal bg-seal/15 p-3 text-sm">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="press mt-3 w-full rounded-pill bg-gold py-3 font-bold text-night disabled:opacity-60">
          {busy ? "계산하고 있어요…" : button}
        </button>
        <p className="mt-2 text-xs leading-relaxed text-text-sub">생년월일은 서버에 저장하지 않아요. 이 탭에서만 잠깐 기억하고, 탭을 닫으면 지워져요.</p>
      </form>
      {result && (
        <section aria-live="polite" className="mt-6">
          {render(result)}
          <Link href="/" className="press mt-4 flex w-full items-center justify-center rounded-pill border border-gold/60 text-sm font-bold text-gold">
            내 사주 카드와 오늘 한 마디도 받기
          </Link>
          <p className="mt-3 text-xs leading-relaxed text-text-sub">참고용 해석이며 의료·법률·투자 판단을 대신하지 않습니다.</p>
        </section>
      )}
    </div>
  );
}
