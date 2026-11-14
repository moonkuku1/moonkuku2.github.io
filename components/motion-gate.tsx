"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** 화면 밖으로 나간 움직이는 그림(.motion)은 멈춰서 휴대폰 배터리를 아낀다. */
export function MotionGate() {
  const path = usePathname();
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".motion");
    if (!items.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) (e.target as HTMLElement).dataset.offscreen = String(!e.isIntersecting);
    });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [path]);
  return null;
}
