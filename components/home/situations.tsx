import { AddButton } from "@/components/cart";
import { GUIDE_NAME, IMG, getQuestion, guideOf, situations } from "@/lib/questions";
import { FACE } from "@/components/home/face";

export function Situations() {
  return (
    <section id="situations" aria-labelledby="sit-title" className="scroll-mt-28 pt-8">
      <h2 id="sit-title" className="px-4 font-serif text-[21px] font-black">
        이럴 땐 이 질문
      </h2>
      <ul className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto px-4 lg:mx-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-5">
        {situations.map((s) => (
          <li
            key={s.id}
            className="w-[78%] shrink-0 snap-start lg:w-auto rounded-card border border-gold/30 bg-surface p-4"
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/category-art/art-${s.art}.png`} alt="" className="h-14 w-14 object-contain" />
              <h3 className="font-serif text-base font-bold leading-snug">{s.title}</h3>
            </div>
            <ul className="mt-3 divide-y divide-gold/15">
              {s.questionIds.map((id) => {
                const q = getQuestion(id);
                if (!q) return null;
                const g = guideOf(q);
                return (
                  <li key={id} className="flex items-center gap-2 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${IMG}/characters/${FACE[g]}`}
                      alt={`${GUIDE_NAME[g]} 얼굴`}
                      className="h-9 w-9 shrink-0 rounded-pill bg-surface-2 object-cover object-top"
                    />
                    <p className="flex-1 text-sm leading-snug">
                      {q.title}
                      <span className="price block text-xs text-text-sub">{q.price}원</span>
                    </p>
                    <AddButton id={q.id} title={q.title} />
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

