"use client";

import { useCart } from "@/components/cart";
import { HOME_SECTIONS } from "@/components/chrome";
import { prefersReducedMotion, useScrollSpy } from "@/components/use-scroll-spy";
import { getQuestion } from "@/lib/questions";

/** PC(너비 1024px 이상)에서만 보이는 양옆 안내. 본문은 가운데 480px 그대로다. */
export function SideRails() {
  const { active, choose } = useScrollSpy(HOME_SECTIONS.map((s) => s.id));
  const { ids, total, toggle } = useCart();

  function go(id: string) {
    choose(id);
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }

  return (
    <>
      <aside
        aria-label="홈 목차"
        className="fixed left-[calc(50%-484px)] top-24 hidden w-[220px] lg:block"
      >
        <p className="mb-2 px-3 text-xs font-bold text-gold">이 페이지</p>
        <ul className="space-y-1">
          {HOME_SECTIONS.map((s) => {
            const on = s.id === active;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(s.id)}
                  aria-current={on ? "true" : undefined}
                  className={`press flex w-full items-center rounded-input border-l-2 px-3 text-left text-sm ${
                    on ? "border-gold bg-surface text-gold" : "border-transparent text-text-sub hover:text-text"
                  }`}
                >
                  {s.label}
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}
          className="press mt-4 w-full rounded-pill border border-gold/40 text-sm text-gold"
        >
          맨 위로
        </button>
      </aside>

      <aside
        aria-label="담은 질문"
        className="fixed left-[calc(50%+264px)] top-24 hidden w-[220px] lg:block"
      >
        <p className="mb-2 text-xs font-bold text-gold">담은 질문 {ids.length}개</p>
        {ids.length === 0 ? (
          <p className="rounded-card border border-gold/20 bg-surface p-3 text-sm text-text-sub">
            질문 옆 ‘+’를 누르면 여기에 모여요.
          </p>
        ) : (
          <div className="rounded-card border border-gold/30 bg-surface p-3">
            <ul className="max-h-[40vh] space-y-1 overflow-y-auto">
              {ids.map((id) => {
                const q = getQuestion(id);
                if (!q) return null;
                return (
                  <li key={id} className="flex items-start gap-1 text-sm leading-snug">
                    <span className="flex-1 py-1">{q.title}</span>
                    <button
                      type="button"
                      aria-label={`${q.title} 빼기`}
                      onClick={() => toggle(id)}
                      className="press flex h-11 w-11 shrink-0 items-center justify-center text-text-sub"
                    >
                      <span aria-hidden="true">✕</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="price mt-2 border-t border-gold/20 pt-2 text-sm">
              합계 <b className="text-gold">{total.toLocaleString()}원</b>
            </p>
            <button type="button" className="press mt-2 w-full rounded-pill bg-cta text-sm font-bold text-night">
              결제하고 바로 보기
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
