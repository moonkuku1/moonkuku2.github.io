import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Noto_Serif_KR, Song_Myung } from "next/font/google";
import { BackToTop } from "@/components/back-to-top";
import { CartProvider } from "@/components/cart";
import "./globals.css";

const songMyung = Song_Myung({
  weight: "400",
 variable: "--font-song-myung",
  display: "swap",
});
const notoSerif = Noto_Serif_KR({
  weight: ["700", "900"],
  preload: false,
  variable: "--font-noto-serif",
  display: "swap",
});
const notoSans = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  preload: false,
  variable: "--font-noto-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "사주300 · 질문 하나에 300원, 결론부터",
  description: "해치 삼백이와 풀이꾼이 질문 하나에 결론부터 답해 드려요.",
  icons: { icon: "/images/saju300-images/logo/haechi-face.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#04101E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth" className={`${songMyung.variable} ${notoSerif.variable} ${notoSans.variable}`}>
      <body>
        <CartProvider>
          {children}
          <BackToTop />
        </CartProvider>
      </body>
    </html>
  );
}





