import Link from "next/link";
import { IMG, getCategory, guides, questionsOf } from "@/lib/questions";

export const DISCLAIMER = "풀이는 참고용 해석이며 의료·법률·투자 판단을 대신하지 않습니다.";

/** 풀이꾼 소개: 한 장씩 작게. 대사는 여기서 한 번만 보여 준다. */
export function Guides() {
  return (
    <section id="guides" aria-labelledby="guides-title" className="scroll-mt-28 px-4 pt-8">
      <h2 id="guides-title" className="font-serif text-[21px] font-black">
        사주300의 풀이꾼
      </h2>
      <p className="mt-1 text-sm text-text-sub">세 풀이꾼은 모두 해치 삼백이가 둔갑한 얼굴이에요. 질문마다 맡은 풀이꾼이 답해요.</p>
      <ul className="mt-3 space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
        {guides.map((g) => {
          const count = g.categories.reduce((n, code) => n + questionsOf(code).length, 0);
          return (
            <li key={g.id} className="flex gap-3 rounded-card border border-gold/30 bg-surface p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${IMG}/characters/${g.face}`}
                alt={`${g.name} 얼굴`}
                className="float motion h-16 w-16 shrink-0 rounded-pill border border-gold/40 bg-surface-2 object-cover object-top"
              />
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-bold">{g.name}</h3>
                <p className="text-xs text-gold">{g.scope}</p>
                <p className="mt-1 text-sm">{g.role}</p>
                <p className="mt-1 font-display text-base leading-snug">{g.line}</p>
                <p className="mt-1 text-xs text-text-sub">
                  {count > 0 ? `담당 질문 ${count}개` : ""}
                  {g.id === "haechi" ? `${count > 0 ? " + " : ""}오늘 한 마디` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {g.categories.map((code) => {
                    const c = getCategory(code);
                    return c ? (
                      <Link key={code} href={`/c/${code}`} className="press flex items-center rounded-pill border border-gold/50 px-3 text-sm text-gold">
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
    <section id="sample" aria-labelledby="sample-title" className="scroll-mt-28 px-4 pt-8">
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




