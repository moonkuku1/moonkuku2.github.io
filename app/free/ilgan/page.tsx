import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";
import { BottomBar } from "@/components/chrome";
import { IlganTool } from "@/components/free/other-tools";
import { FREE_TOOLS } from "@/lib/free-list";

const tool = FREE_TOOLS.find((t) => t.slug === "ilgan")!;

export const metadata: Metadata = {
  title: `${tool.pageTitle} · 사주300`,
  description: tool.desc,
  alternates: { canonical: `/free/${tool.slug}` },
};

export default function Page() {
  return (
    <div className="app-shell app-shell-wide">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-gold/20 bg-night/95 backdrop-blur">
        <BackButton label="이전 화면" />
        <h1 className="ml-1 font-serif text-lg font-bold">{tool.pageTitle}</h1>
      </header>
      <main className="px-4 pb-40 pt-5 lg:mx-auto lg:max-w-xl lg:pb-16">
        <p className="text-sm text-text-sub">{tool.intro}</p>
        <div className="mt-4">
          <IlganTool />
        </div>
      </main>
      <BottomBar current="home" />
    </div>
  );
}