"use client";

import { useRef, useState } from "react";
import { prefersReducedMotion } from "@/components/use-scroll-spy";

/**
 * 옆으로 넘기는 목록. 휴대폰에서는 한 장씩 넘기고(아래에 점으로 위치 표시), PC에서는 같은 내용을 나란히 펼친다.
 * 손가락으로 넘기는 것 말고도 점을 눌러 이동할 수 있고, 키보드 화살표로도 넘길 수 있다.
 */
export function Slider({
  label,
  items,
  itemWidth = "w-[86%]",
  desktop = "lg:grid lg:grid-cols-3 lg:gap-4",
}: {
  label: string;
  items: React.ReactNode[];
  /** 휴대폰에서 한 장의 너비 */
  itemWidth?: string;
  /** PC에서 펼치는 모양 */
  desktop?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  function onScroll() {
    const el = ref.current;
    if (!el || el.children.length === 0) return;
    const first = el.children[0] as HTMLElement;
    const step = first.offsetWidth + 12; // 한 장 너비 + 간격
    setActive(Math.min(items.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  }

  function go(i: number) {
    const target = ref.current?.children[i] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", inline: "center", block: "nearest" });
  }

  return (
    <div>
      <ul
        ref={ref}
        onScroll={onScroll}
        // 키보드로 목록에 들어가면 화살표로 넘길 수 있다
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(Math.min(items.length - 1, active + 1));
          if (e.key === "ArrowLeft") go(Math.max(0, active - 1));
        }}
        aria-label={`${label} (옆으로 넘겨 보세요)`}
        className={`no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 outline-none focus-visible:ring-2 focus-visible:ring-gold lg:overflow-visible lg:px-0 ${desktop}`}
      >
        {items.map((it, i) => (
          <li key={i} className={`shrink-0 snap-center ${itemWidth} lg:w-auto`}>
            {it}
          </li>
        ))}
      </ul>
      {items.length > 1 && (
        <div className="mt-1 flex justify-center lg:hidden" role="group" aria-label={`${label} 위치`}>
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}번째로 이동`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => go(i)}
              className="press flex h-11 w-7 items-center justify-center"
            >
              <span className={`block h-2 rounded-pill transition-all ${i === active ? "w-5 bg-gold" : "w-2 bg-gold/30"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
