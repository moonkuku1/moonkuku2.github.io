import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** 결과·장바구니·API는 검색에 나오지 않게 한다 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/r/", "/cart"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
