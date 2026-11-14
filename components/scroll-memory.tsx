"use client";

import { useEffect } from "react";
import { SCROLL_KEY } from "@/components/chrome";

/** 홈에서 보던 위치를 기억해 두었다가, 다른 화면에 갔다 돌아오면 그 자리로 되돌린다. */
export function ScrollMemory() {
  useEffect(() => {
    const saved = Number(sessionStorage.getItem(SCROLL_KEY) ?? 0);
    let restore: ReturnType<typeof setTimeout> | undefined;
    if (!location.hash && saved > 0) {
      // 그림이 자리를 잡은 뒤에 이동한다.
      restore = setTimeout(() => window.scrollTo({ top: saved, behavior: "auto" }), 80);
    }

    let raf = 0;
    const save = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
      });
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      window.removeEventListener("scroll", save);
      if (raf) cancelAnimationFrame(raf);
      if (restore) clearTimeout(restore);
    };
  }, []);
  return null;
}
