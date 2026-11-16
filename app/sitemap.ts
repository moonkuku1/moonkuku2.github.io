import type { MetadataRoute } from "next";
import { categories, guides } from "@/lib/questions";
import { FREE_TOOLS } from "@/lib/free-list";
import { LEGAL_DOCS } from "@/lib/legal";
import { publishedList } from "@/lib/q-pages";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** 검색 엔진에 알려 줄 주소: 홈, 주제 페이지, 법적 문서, 그리고 사람이 검토해 공개한 질문 소개 페이지 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/` },
    { url: `${SITE}/free` },
    ...FREE_TOOLS.map((t) => ({ url: `${SITE}/free/${t.slug}` })),
    ...guides.map((g) => ({ url: `${SITE}/g/${g.id}` })),
    ...categories.map((c) => ({ url: `${SITE}/c/${c.code}` })),
    ...LEGAL_DOCS.map((d) => ({ url: `${SITE}/legal/${d.slug}` })),
    ...publishedList().map((id) => ({ url: `${SITE}/q/${id}` })),
  ];
}
