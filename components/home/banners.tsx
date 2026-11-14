import Link from "next/link";
import { IMG, getGuide, type Guide } from "@/lib/questions";

const BANNERS: {
  guide: Guide;
  file: string;
  price: string;
  button: string;
  href: string;
  alt: string;
  moon: { x: number; y: number };
}[] = [
  {
    guide: "assi",
    file: "banner-1-assi.jpg",
    price: "하나에 300원",
    button: "연애 질문 보기",
    href: "/c/L",
    alt: "연꽃 핀 달밤 호숫가에서 부채를 들고 손을 내미는 삼백 아씨",
    moon: { x: 10, y: 12 },
  },
  {
    guide: "doryeong",
    file: "banner-2-doryeong.jpg",
    price: "하나에 300원",
    button: "일 질문 보기",
    href: "/c/J",
    alt: "두루마리를 들고 웃으며 손을 내미는 갓 쓴 삼백 도령",
    moon: { x: 87, y: 12 },
  },
  {
    guide: "haechi",
    file: "banner-3-haechi.jpg",
    price: "오늘 한 마디는 무료",
    button: "오늘 한 마디 받기",
    href: "#today",
    alt: "작은 상 위 종이에 붉은 도장을 찍는 해치 삼백이",
    moon: { x: 85, y: 11 },
  },
];

export function Banners() {
  return (
    <section aria-label="풀이꾼 소개" className="pt-4">
      <ul className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible">
        {BANNERS.map((b) => {
          const g = getGuide(b.guide);
          return (
            <li
              key={b.guide}
              className="relative aspect-[3/4] w-[86%] shrink-0 snap-center overflow-hidden rounded-card border border-gold/30 lg:w-auto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${IMG}/banners/${b.file}`}
                alt={b.alt}
                className="kenburns motion absolute inset-0 h-full w-full object-cover"
              />
              <span
                aria-hidden="true"
                className="moon-glow motion"
                style={{ left: `${b.moon.x}%`, top: `${b.moon.y}%` }}
              />
              <div className="absolute inset-x-0 bottom-0 flex h-[40%] flex-col justify-end gap-1 bg-gradient-to-t from-night via-night/90 to-transparent p-4">
                <p className="text-xs text-gold">
                  {g.name} · {g.scope}
                </p>
                <p className="font-display text-xl leading-snug">{g.line}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="price text-sm text-text-sub">{b.price}</span>
                  <Link
                    href={b.href}
                    className="press flex items-center rounded-pill bg-cta px-4 text-sm font-bold text-night"
                  >
                    {b.button}
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
