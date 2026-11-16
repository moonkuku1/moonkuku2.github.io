"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BirthFields } from "@/components/birth-fields";
import { EMPTY_FORM, ME_KEY, birthBody, type Form } from "@/lib/birth-form";
import type { FreeSinsal } from "@/lib/free-sinsal";
import { ELEMENT_COLOR } from "@/lib/result";
import { track } from "@/lib/track";

const ELEMENT_KO = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" } as const;

/** 무료 신살 조회: 생년월일을 넣으면 사주 안의 신살을 찾아 보여 준다. 입력값은 이 탭에서만 기억한다. */
export function SinsalTool() {
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [maxYear, setMaxYear] = useState(2026);
  const [result, setResult] = useState<FreeSinsal | null>(null);
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
    if (!form.gender) return setError("성별을 골라 주세요.");
    setBusy(true);
    try {
      const res = await fetch("/api/free/sinsal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(birthBody(form)) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "잠시 후 다시 시도해 주세요.");
      setResult(json.result);
      track("free_sinsal");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} noValidate className="rounded-card border border-gold/30 bg-surface/95 p-4">
        <BirthFields form={form} setForm={setForm} maxYear={maxYear} idPrefix="s" />
        {error && (
          <p role="alert" className="mt-3 rounded-input border border-seal bg-seal/15 p-3 text-sm">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="press mt-3 w-full rounded-pill bg-gold py-3 font-bold text-night disabled:opacity-60">
          {busy ? "찾고 있어요…" : "내 신살 무료로 찾기"}
        </button>
        <p className="mt-2 text-xs leading-relaxed text-text-sub">생년월일은 서버에 저장하지 않아요. 이 탭에서만 잠깐 기억하고, 탭을 닫으면 지워져요.</p>
      </form>

      {result && (
        <section aria-labelledby="sinsal-result" tabIndex={-1} className="mt-6">
          <h2 id="sinsal-result" className="font-serif text-[21px] font-black">내 사주의 신살</h2>

          <div className={`mt-3 grid gap-2 text-center ${result.pillars.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
            {result.pillars.map((p) => (
              <div key={p.label}>
                <p className="mb-1 text-xs text-text-sub">{p.label}</p>
                {[p.stem, p.branch].map((c, i) => (
                  <div
                    key={i}
                    role="img"
                    aria-label={`${p.label} ${i === 0 ? "천간" : "지지"} ${c.ch} ${c.label}`}
                    className={`mb-1 flex h-12 flex-col items-center justify-center rounded-input font-serif text-xl font-black ${c.element === "metal" ? "text-ink" : "text-hanji"}`}
                    style={{ backgroundColor: ELEMENT_COLOR[c.element] }}
                  >
                    {c.ch}
                    <span className="text-xs font-normal leading-none">{ELEMENT_KO[c.element]}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {result.timeUnknown && <p className="mt-1 rounded-input border border-gold/20 bg-night/60 p-2 text-xs text-text-sub">태어난 시간을 몰라 시주 없이 찾았어요. 시주에 있는 신살은 빠져 있을 수 있어요.</p>}

          {result.found.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {result.found.map((s) => (
                <li key={s.name} className="rounded-card border border-gold/30 bg-surface p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="font-serif text-lg font-bold text-gold">{s.name}</h3>
                    <p className="text-xs text-text-sub">{s.where.join(" · ")}</p>
                  </div>
                  <p className="mt-1 text-sm">{s.summary}</p>
                  <p className="mt-1 text-sm text-text-sub">{s.tip}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-card border border-gold/30 bg-surface p-4 text-sm">이 사주에서는 조회 대상 신살이 나오지 않았다. 신살이 없다고 부족한 것은 아니다.</p>
          )}
          {result.absent.length > 0 && <p className="mt-3 text-xs text-text-sub">나오지 않은 신살: {result.absent.join(", ")}</p>}

          <div className="mt-4 rounded-card border border-gold/30 bg-surface p-4">
            <h3 className="font-serif text-lg font-bold">{result.samjae.year}년 삼재</h3>
            <p className="mt-1 text-sm">
              {result.samjae.active ? `올해는 ${result.samjae.phase}에 해당한다. 삼재는 3년 주기로 오는 흐름의 이름이며, 조심하며 차분히 지내라는 뜻으로 보면 된다.` : "올해는 삼재에 해당하지 않는다."}
            </p>
            {result.samjae.years.length > 0 && <p className="mt-1 text-xs text-text-sub">삼재 해: {result.samjae.years.join("년, ")}년</p>}
          </div>

          <Link href="/" className="press mt-4 flex w-full items-center justify-center rounded-pill border border-gold/60 text-sm font-bold text-gold">
            내 사주 카드와 오늘 한 마디도 받기
          </Link>
          <p className="mt-3 text-xs leading-relaxed text-text-sub">신살은 사주 여덟 글자에서 찾은 참고용 해석이며, 의료·법률·투자 판단을 대신하지 않습니다.</p>
        </section>
      )}
    </div>
  );
}
