"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart";
import { prefersReducedMotion } from "@/components/use-scroll-spy";

/** 조금 내려가면 나타나는 ‘맨 위로’ 버튼. 아래 고정 메뉴·담은 질문 줄과 겹치지 않게 높이를 맞춘다. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const { ids } = useCart();
  const onHome = usePathname() === "/";

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  // 홈은 PC에서 아래 메뉴가 없고 넓게 펼쳐지므로 위치가 다르다.
  const bottom = onHome ? (ids.length > 0 ? "bottom-[156px] lg:bottom-[88px]" : "bottom-[88px] lg:bottom-6") : "bottom-[88px]";
  const width = onHome ? "max-w-[480px] lg:max-w-[1200px]" : "max-w-[480px]";
  return (
    <div className={`pointer-events-none fixed left-1/2 z-40 w-full ${width} -translate-x-1/2 ${bottom}`}>
      <button
        type="button"
        aria-label="맨 위로"
        onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}
        className="press pointer-events-auto ml-auto mr-3 flex h-12 w-12 items-center justify-center rounded-pill border border-gold bg-night/95 text-xl text-gold shadow-lg"
      >
        <span aria-hidden="true">↑</span>
      </button>
    </div>
  );
}

