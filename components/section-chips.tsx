"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion, useScrollSpy } from "@/components/use-scroll-spy";

export type Section = { id: string; label: string };

/** 가로로 넘기는 구역 이동 칩. 지금 보는 구역이 금색으로 바뀌고, 선택된 칩이 가운데로 따라온다. */
export function SectionChips({ sections, className = "" }: { sections: Section[]; className?: string }) {
  const { active, choose } = useScrollSpy(sections.map((s) => s.id));
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const box = nav.current;
    const el = box?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!box || !el) return;
    box.scrollTo({
      left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [active]);

  return (
    <nav ref={nav} aria-label="구역 이동" className={`no-scrollbar relative flex overflow-x-auto px-2 ${className}`}>
      {sections.map((s) => {
        const on = s.id === active;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            data-id={s.id}
            aria-current={on ? "true" : undefined}
            onClick={() => choose(s.id)}
            className={`press flex min-h-11 shrink-0 items-center border-b-2 px-4 text-sm font-medium transition-colors ${
              on ? "border-gold text-gold" : "border-transparent text-text-sub"
            }`}
          >
            {s.label}
          </a>
        );
      })}
    </nav>
  );
}
