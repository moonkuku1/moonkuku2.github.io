"use client";

import { useRouter } from "next/navigation";

/** 이전 화면으로. 이 사이트 안에서 온 게 아니면(링크로 바로 들어온 경우) 홈으로 보낸다. */
export function BackButton({ label = "이전 화면" }: { label?: string }) {
  const router = useRouter();
  function back() {
    const cameFromHere = document.referrer && new URL(document.referrer).origin === location.origin;
    if (cameFromHere && history.length > 1) router.back();
    else router.push("/");
  }
  return (
    <button type="button" onClick={back} className="press flex items-center gap-1 px-3 text-sm text-text">
      <span aria-hidden="true">←</span> {label}
    </button>
  );
}
