"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart";
import { shareImage } from "@/lib/share-client";
import { track } from "@/lib/track";

/** 결과 화면 아래 고정 버튼: 판정 카드 공유(이미지) / 다른 질문 고르기(담으면 "N개 · 금액" 줄) */
export function ResultBottom({ body }: { body: unknown }) {
  const { ids, total } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function share() {
    setError(null);
    setBusy(true);
    try {
      track("share_card");
      await shareImage("/api/share/result", body, "saju300-판정카드.png", "사주300 판정 카드");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-gold/20 bg-night/95 p-3 backdrop-blur">
      {error && (
        <p role="alert" className="mb-2 rounded-input border border-seal bg-seal/15 p-2 text-sm">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={share} disabled={busy} className="press rounded-pill border border-gold text-sm font-bold text-gold disabled:opacity-60">
          {busy ? "만드는 중…" : "판정 카드 공유"}
        </button>
        {ids.length > 0 ? (
          <Link href="/cart" className="press flex items-center justify-center rounded-pill bg-cta text-sm font-bold text-night">
            <span className="price">
              {ids.length}개 · {total.toLocaleString()}원 보기
            </span>
          </Link>
        ) : (
          <Link href="/#categories" className="press flex items-center justify-center rounded-pill bg-cta text-sm font-bold text-night">
            다른 질문 고르기
          </Link>
        )}
      </div>
    </div>
  );
}
