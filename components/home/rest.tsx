import Link from "next/link";
import { filledBusinessInfo } from "@/lib/business-info";
import { LEGAL_DOCS } from "@/lib/legal";
import { Slider } from "@/components/slider";

export const DISCLAIMER = "풀이는 참고용 해석이며 의료·법률·투자 판단을 대신하지 않습니다.";

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
    <section aria-labelledby="promise-title" className="pt-8">
      <h2 id="promise-title" className="px-4 font-serif text-[21px] font-black">
        사주300의 약속 3가지
      </h2>
      <div className="mt-3 lg:px-4">
        <Slider
          label="약속"
          itemWidth="w-[78%]"
          items={items.map(([t, d], i) => (
            <div key={t} className="flex h-full gap-3 rounded-card border border-gold/20 bg-surface p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-gold font-bold text-night">{i + 1}</span>
              <p className="text-sm">
                <b className="text-gold">{t}</b> · {d}
              </p>
            </div>
          ))}
        />
      </div>
    </section>
  );
}

export function Footer() {
  const info = filledBusinessInfo();
  return (
    <footer className="px-4 pb-40 pt-10 text-xs leading-relaxed text-text-sub lg:pb-16">
      <nav aria-label="안내 문서" className="flex flex-wrap gap-x-4">
        {LEGAL_DOCS.map((d) => (
          <Link key={d.slug} href={`/legal/${d.slug}`} className="press flex items-center underline underline-offset-2">
            {d.title}
          </Link>
        ))}
      </nav>
      {info.length > 0 && (
        <p className="mt-2">{info.map(([k, v]) => `${k} ${v}`).join(" · ")}</p>
      )}
      <p className="mt-2">{DISCLAIMER}</p>
      <p className="mt-2">© 사주300</p>
    </footer>
  );
}
