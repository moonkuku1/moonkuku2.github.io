import { GUIDE_NAME, IMG, type Guide } from "@/lib/questions";

const BANNERS: {
  guide: Guide;
  file: string;
  scope: string;
  line: string;
  price: string;
  button: string;
  target: string;
  alt: string;
}[] = [
  {
    guide: "assi",
    file: "banner-1-assi.jpg",
    scope: "연애 · 결혼 · 궁합",
    line: "좋아하는지 아닌지, 첫 줄에 말해 줄게요.",
    price: "하나에 300원",
    button: "연애 질문 보기",
    target: "#cat-L",
    alt: "연꽃 핀 달밤 호숫가에서 부채를 들고 손을 내미는 삼백 아씨",
  },
  {
    guide: "doryeong",
    file: "banner-2-doryeong.jpg",
    scope: "일 · 재물 · 시험 · 가족",
    line: "버틸지 그만둘지, 도장 찍어 드립니다.",
    price: "하나에 300원",
    button: "일 질문 보기",
    target: "#cat-J",
    alt: "두루마리를 들고 웃으며 손을 내미는 갓 쓴 삼백 도령",
  },
  {
    guide: "haechi",
    file: "banner-3-haechi.jpg",
    scope: "오늘 한 마디 · 올해 · 나",
    line: "오늘의 한 줄은 그냥 주마. 생일만 알려 다오.",
    price: "오늘 한 마디는 무료",
    button: "오늘 한 마디 받기",
    target: "#today",
    alt: "작은 상 위 종이에 붉은 도장을 찍는 해치 삼백이",
  },
];

export function Banners() {
  return (
    <section aria-label="풀이꾼 소개" className="pt-4">
      <ul className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
        {BANNERS.map((b) => (
          <li key={b.guide} className="relative aspect-[3/4] w-[86%] shrink-0 snap-center overflow-hidden rounded-card border border-gold/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/banners/${b.file}`} alt={b.alt} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex h-[40%] flex-col justify-end gap-1 bg-gradient-to-t from-night via-night/90 to-transparent p-4">
              <p className="text-xs text-gold">
                {GUIDE_NAME[b.guide]} · {b.scope}
              </p>
              <p className="font-display text-xl leading-snug">{b.line}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="price text-sm text-text-sub">{b.price}</span>
                <a
                  href={b.target}
                  className="press flex items-center rounded-pill bg-cta px-4 text-sm font-bold text-night"
                >
                  {b.button}
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}


