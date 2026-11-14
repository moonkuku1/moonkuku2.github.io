import Link from "next/link";
import { IMG, getCategory, guides, questionsOf, type Guide } from "@/lib/questions";

export const DISCLAIMER = "풀이는 참고용 해석이며 의료·법률·투자 판단을 대신하지 않습니다.";

const SCENES: Record<Guide, { file: string; alt: string }> = {
  assi: { file: "guide-assi.jpg", alt: "연꽃 핀 달밤 호숫가에서 사주 명식표를 보며 활짝 웃는 삼백 아씨" },
  doryeong: { file: "guide-doryeong.jpg", alt: "갓을 쓰고 붓으로 월별 흐름 병풍을 가리키며 웃는 삼백 도령" },
  haechi: { file: "guide-haechi.jpg", alt: "두루마리 위에 붉은 도장을 찍으려는 해치 삼백이" },
};

export function Guides() {
  return (
    <section id="guides" aria-labelledby="guides-title" className="scroll-mt-28 px-4 pt-8">
      <h2 id="guides-title" className="font-serif text-[21px] font-black">
        사주300의 풀이꾼
      </h2>
      <p className="mt-1 text-sm text-text-sub">세 풀이꾼은 모두 해치 삼백이가 둔갑한 얼굴이에요. 질문마다 맡은 풀이꾼이 답해요.</p>
      <ul className="mt-3 space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
        {guides.map((g) => {
          const scene = SCENES[g.id];
          const count = g.categories.reduce((n, code) => n + questionsOf(code).length, 0);
          return (
            <li
              key={g.id}
              className="relative aspect-[3/4] overflow-hidden rounded-card border border-gold/30 bg-surface lg:aspect-[4/5]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${IMG}/guides/${scene.file}`}
                alt={scene.alt}
                className="kenburns motion absolute inset-0 h-full w-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/95 to-transparent p-4 pt-14">
                <h3 className="font-serif text-lg font-bold">
                  {g.name} <span className="ml-1 text-xs font-medium text-gold">{g.scope}</span>
                </h3>
                <p className="mt-1 text-sm">{g.role}</p>
                <p className="mt-1 font-display text-lg leading-snug">{g.line}</p>
                <p className="mt-1 text-xs text-text-sub">
                  {g.categories.length > 0 && `담당 질문 ${count}개`}
                  {g.id === "haechi" && " + 오늘 한 마디"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {g.categories.map((code) => {
                    const c = getCategory(code);
                    return c ? (
                      <Link
                        key={code}
                        href={`/c/${code}`}
                        className="press flex items-center rounded-pill border border-gold/50 px-3 text-sm text-gold"
                      >
                        {c.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
export function SampleAnswer() {
  return (
    <section aria-labelledby="sample-title" className="px-4 pt-8">
      <h2 id="sample-title" className="font-serif text-[21px] font-black">
        300원이면 이렇게 받아요
      </h2>
      <div className="hanji mt-3 rounded-card p-6">
        <p className="text-xs font-bold text-seal">답변 예시</p>
        <p className="mt-1 font-serif text-[22px] font-black leading-snug">5월과 9월이 가장 유력해요.</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>· 판정: 다음 인연이 들어오는 달</li>
          <li>· 근거: 세운에 배우자성이 들어와요</li>
          <li>· 확신도: 중</li>
          <li>· 이번 달 처방: 새 모임 한 곳에 나가 보세요</li>
        </ul>
        <p className="mt-3 text-xs text-ink/70">결론을 첫 줄에, 근거를 바로 아래에 보여 드려요.</p>
      </div>
    </section>
  );
}

export function FreeCard() {
  return (
    <section id="free" aria-labelledby="free-title" className="scroll-mt-28 px-4 pt-8">
      <h2 id="free-title" className="font-serif text-[21px] font-black">
        무료 일주 카드
      </h2>
      <div className="mt-3 flex items-center gap-3 rounded-card border border-gold/30 bg-surface-2 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${IMG}/logo/haechi-face.png`} alt="" className="float motion h-12 w-12" />
        <p className="flex-1 text-sm">생일만 알려 주면 내 일주 카드를 무료로 보여 드려요.</p>
        <a href="#today" className="press flex items-center rounded-pill border border-gold px-4 text-sm font-bold text-gold">
          시작
        </a>
      </div>
    </section>
  );
}

export function Promises() {
  const items = [
    ["결론부터", "첫 줄에 답을 말하고, 그 뒤에 근거를 보여 드려요."],
    ["계산은 코드가", "시기와 판정은 사주 계산으로 정하고, 문장은 그 결과만 풀어 써요."],
    ["겁주지 않아요", "불안을 부추기지 않고, 선택에 도움이 되는 말만 해요."],
  ];
  return (
    <section aria-labelledby="promise-title" className="px-4 pt-8">
      <h2 id="promise-title" className="font-serif text-[21px] font-black">
        사주300의 약속 3가지
      </h2>
      <ol className="mt-3 space-y-2 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
        {items.map(([t, d], i) => (
          <li key={t} className="flex gap-3 rounded-card border border-gold/20 bg-surface p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-gold font-bold text-night">
              {i + 1}
            </span>
            <p className="text-sm">
              <b className="text-gold">{t}</b> · {d}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="px-4 pb-40 pt-10 text-xs leading-relaxed text-text-sub">
      <p>{DISCLAIMER}</p>
      <p className="mt-2">© 사주300</p>
    </footer>
  );
}



