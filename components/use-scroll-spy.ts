"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 스크롤하면서 지금 보고 있는 구역의 id를 알려 준다.
 * choose(id)를 부르면(탭을 눌렀을 때) 이동이 끝날 때까지 바로 그 구역을 강조한다.
 */
export function useScrollSpy(ids: string[], offset = 150) {
  const [active, setActive] = useState(ids[0]);
  const lockUntil = useRef(0);
  const key = ids.join("|");

  useEffect(() => {
    const list = key.split("|");
    let raf = 0;
    const update = () => {
      raf = 0;
      if (Date.now() < lockUntil.current) return;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = list[0];
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      if (atBottom) current = list[list.length - 1];
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [key, offset]);

  const choose = useCallback((id: string) => {
    lockUntil.current = Date.now() + 900;
    setActive(id);
  }, []);

  return { active, choose };
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
