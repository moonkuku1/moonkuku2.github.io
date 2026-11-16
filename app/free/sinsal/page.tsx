import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";
import { BottomBar } from "@/components/chrome";
import { SinsalTool } from "@/components/free/sinsal-tool";

export const metadata: Metadata = {
  title: "무료 신살 조회 · 사주300",
  description: "생년월일로 도화·역마·화개·천을귀인 등 내 사주의 신살과 올해 삼재를 무료로 찾아요.",
  alternates: { canonical: "/free/sinsal" },
};

export default function FreeSinsalPage() {
  return (
    <div className="app-shell app-shell-wide">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-gold/20 bg-night/95 backdrop-blur">
        <BackButton label="이전 화면" />
        <h1 className="ml-1 font-serif text-lg font-bold">무료 신살 조회</h1>
      </header>
      <main className="px-4 pb-40 pt-5 lg:mx-auto lg:max-w-xl lg:pb-16">
        <p className="text-sm text-text-sub">생년월일을 넣으면 내 사주에 있는 신살과 올해 삼재를 바로 알려 드려요. 가입도 결제도 필요 없어요.</p>
        <div className="mt-4">
          <SinsalTool />
        </div>
      </main>
      <BottomBar current="home" />
    </div>
  );
}
