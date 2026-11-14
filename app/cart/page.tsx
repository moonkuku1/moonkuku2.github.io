import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = { title: "장바구니 · 사주300" };

export default function CartPage() {
  return (
    <div className="app-shell">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-gold/20 bg-night/95 backdrop-blur">
        <BackButton label="이전 화면" />
        <h1 className="ml-1 font-serif text-lg font-bold">장바구니</h1>
      </header>
      <main>
        <CartView />
      </main>
    </div>
  );
}
