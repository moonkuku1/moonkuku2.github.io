"use client";

import { useState } from "react";

// 샘플 문장 모드(요구사항 3.9): 판정 엔진이 붙기 전까지 날짜로 고른 샘플 문장을 보여준다.
const LINES = [
  "오늘은 먼저 연락하는 쪽이 이깁니다.",
  "오늘은 새로 벌이기보다 마무리가 좋은 날이다.",
  "오늘은 서두르지 않는 쪽이 이득이다.",
  "오늘은 가까운 사람의 말을 한 번 더 들어 보아라.",
  "오늘은 작은 지출을 아끼는 날이다.",
];

const years = Array.from({ length: 80 }, (_, i) => 2010 - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

const field =
  "min-h-11 rounded-input border border-gold/30 bg-surface px-2 text-sm text-text focus:border-gold";

export function Today() {
  const [y, setY] = useState("");
  const [m, setM] = useState("");
  const [d, setD] = useState("");
  const [line, setLine] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!y || !m || !d) return;
    // 생년월일은 저장하지 않고 화면에서만 쓴다.
    const seed = Number(y) + Number(m) * 31 + Number(d) + new Date().getDate();
    setLine(LINES[seed % LINES.length]);
  }

  return (
    <section id="today" aria-labelledby="today-title" className="scroll-mt-28 px-4 pt-8">
      <h2 id="today-title" className="font-serif text-[21px] font-black">
        해치의 오늘 한 마디 <span className="ml-1 text-sm font-medium text-gold">무료</span>
      </h2>
      <form onSubmit={submit} className="mt-3 rounded-card border border-gold/30 bg-surface p-4">
        <fieldset>
          <legend className="mb-2 text-sm text-text-sub">양력 생년월일을 골라 주세요</legend>
          <div className="grid grid-cols-3 gap-2">
            <label className="sr-only" htmlFor="by">년</label>
            <select id="by" value={y} onChange={(e) => setY(e.target.value)} className={field} required>
              <option value="">년</option>
              {years.map((v) => <option key={v} value={v}>{v}년</option>)}
            </select>
            <label className="sr-only" htmlFor="bm">월</label>
            <select id="bm" value={m} onChange={(e) => setM(e.target.value)} className={field} required>
              <option value="">월</option>
              {months.map((v) => <option key={v} value={v}>{v}월</option>)}
            </select>
            <label className="sr-only" htmlFor="bd">일</label>
            <select id="bd" value={d} onChange={(e) => setD(e.target.value)} className={field} required>
              <option value="">일</option>
              {days.map((v) => <option key={v} value={v}>{v}일</option>)}
            </select>
          </div>
        </fieldset>
        <button type="submit" className="press mt-3 w-full rounded-pill border border-gold bg-gold font-bold text-night">
          오늘 한 마디 받기
        </button>
      </form>

      {line && (
        <div className="hanji relative mt-3 rounded-card p-6" role="status">
          <p className="font-display text-2xl leading-snug">{line}</p>
          <p className="mt-3 text-xs text-ink/70">지금은 샘플 문장이에요. 풀이 엔진이 붙으면 내 사주로 바뀌어요.</p>
          <span
            aria-hidden="true"
            className="stamp-anim absolute right-5 top-5 flex h-16 w-16 items-center justify-center border-2 border-seal font-serif text-2xl font-black text-seal"
          >
            今日
          </span>
          <a href="#categories" className="press mt-3 flex items-center text-sm font-bold text-seal underline">
            더 궁금하면 300원 질문 보기 →
          </a>
        </div>
      )}
    </section>
  );
}
