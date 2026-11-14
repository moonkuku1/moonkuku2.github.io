"use client";

import Link from "next/link";
import { useCart } from "@/components/cart";

export function ResultBottom({ orderId }: { orderId: string }) {
  const { ids, total } = useCart();
  return (
    <div className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-2 gap-2 border-t border-gold/20 bg-night/95 p-3 backdrop-blur">
      <a
        href={`/api/share/story?order=${encodeURIComponent(orderId)}`}
        download={`saju300-${orderId}.png`}
        className="press flex items-center justify-center rounded-pill border border-gold text-sm font-bold text-gold"
      >
        판정 카드 공유
      </a>
      {ids.length > 0 ? (
        <button type="button" className="press rounded-pill bg-cta text-sm font-bold text-night">
          <span className="price">
            {ids.length}개 · {total.toLocaleString()}원
          </span>{" "}
          결제
        </button>
      ) : (
        <Link href="/#categories" className="press flex items-center justify-center rounded-pill bg-cta text-sm font-bold text-night">
          다른 질문 고르기
        </Link>
      )}
    </div>
  );
}
