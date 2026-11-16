"use client";
import type { Dispatch, SetStateAction } from "react";
import type { Form } from "@/lib/birth-form";

/** 생년월일·태어난 시간·성별 입력칸. 홈 첫 화면과 무료 풀이 페이지가 같이 쓴다. */
const field = "min-h-11 w-full rounded-input border border-gold/30 bg-night px-2 text-sm text-text focus:border-gold";
const seg = (on: boolean) => `press flex-1 rounded-input border text-sm font-medium ${on ? "border-gold bg-gold text-night" : "border-gold/30 text-text-sub"}`;

export function BirthFields({ form, setForm, maxYear, idPrefix = "b", showTime = true, showGender = true }: { form: Form; setForm: Dispatch<SetStateAction<Form>>; maxYear: number; idPrefix?: string; showTime?: boolean; showGender?: boolean }) {
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const [hh, mm] = form.time ? form.time.split(":") : ["", "00"];
  const setTime = (h: string, m: string) => setForm((f) => ({ ...f, time: h ? `${h}:${m || "00"}` : "" }));
  const years = Array.from({ length: maxYear - 1929 }, (_, i) => maxYear - i);
  return (
    <>
              <div role="group" aria-label="양력 또는 음력" className="flex gap-2">
                <button type="button" aria-pressed={form.calendar === "solar"} onClick={() => set("calendar", "solar")} className={seg(form.calendar === "solar")}>
                  양력
                </button>
                <button type="button" aria-pressed={form.calendar === "lunar"} onClick={() => set("calendar", "lunar")} className={seg(form.calendar === "lunar")}>
                  음력
                </button>
              </div>

              <fieldset className="mt-3">
                <legend className="mb-1 text-sm text-text-sub">생년월일</legend>
                <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2">
                  <label className="sr-only" htmlFor={`${idPrefix}y`}>년</label>
                  <select id={`${idPrefix}y`} className={field} value={form.year} onChange={(e) => set("year", e.target.value)}>
                    <option value="">년</option>
                    {years.map((y) => <option key={y} value={y}>{y}년</option>)}
                  </select>
                  <label className="sr-only" htmlFor={`${idPrefix}m`}>월</label>
                  <select id={`${idPrefix}m`} className={field} value={form.month} onChange={(e) => set("month", e.target.value)}>
                    <option value="">월</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}월</option>)}
                  </select>
                  <label className="sr-only" htmlFor={`${idPrefix}d`}>일</label>
                  <select id={`${idPrefix}d`} className={field} value={form.day} onChange={(e) => set("day", e.target.value)}>
                    <option value="">일</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}일</option>)}
                  </select>
                </div>
                {form.calendar === "lunar" && (
                  <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.leap} onChange={(e) => set("leap", e.target.checked)} className="h-5 w-5 accent-[var(--color-gold)]" />
                    윤달에 태어났어요
                  </label>
                )}
              </fieldset>

              {showTime && (
              <fieldset className="mt-3">
                <legend className="mb-1 text-sm text-text-sub">
                  태어난 시간 <span className="text-xs">(몰라도 돼요)</span>
                </legend>
                <div className={`grid gap-2 ${hh ? "grid-cols-2" : "grid-cols-1"}`}>
                  <label className="sr-only" htmlFor={`${idPrefix}h`}>시</label>
                  <select id={`${idPrefix}h`} className={field} value={hh} onChange={(e) => setTime(e.target.value, mm)}>
                    <option value="">모름</option>
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => <option key={h} value={h}>{Number(h)}시</option>)}
                  </select>
                  {hh && (
                    <>
                      <label className="sr-only" htmlFor={`${idPrefix}n`}>분</label>
                      <select id={`${idPrefix}n`} className={field} value={mm} onChange={(e) => setTime(hh, e.target.value)}>
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => <option key={m} value={m}>{Number(m)}분</option>)}
                      </select>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs text-text-sub">모르면 &lsquo;모름&rsquo;으로 두세요. 시주 없이 계산하고 확신도를 한 단계 낮춰요.</p>
              </fieldset>
              )}

              {showGender && (
              <div role="group" aria-label="성별" className="mt-3">
                <span className="mb-1 block text-sm text-text-sub">성별</span>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed={form.gender === "female"} onClick={() => set("gender", "female")} className={`${seg(form.gender === "female")} h-11`}>
                    여성
                  </button>
                  <button type="button" aria-pressed={form.gender === "male"} onClick={() => set("gender", "male")} className={`${seg(form.gender === "male")} h-11`}>
                    남성
                  </button>
                </div>
              </div>
              )}
    </>
  );
}