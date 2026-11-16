"use client";
import { FreeShell, PillarGrid, TIME_UNKNOWN_NOTE } from "@/components/free/free-shell";
import type { FreeIlgan, FreeOhaeng, FreeTti } from "@/lib/free-tools";

/** 내 오행 분포: 목·화·토·금·수가 각각 얼마나 있는지 막대로 보여 준다. */
export function OhaengTool() {
  return (
    <FreeShell<FreeOhaeng>
      endpoint="/api/free/ohaeng"
      event="free_ohaeng"
      button="내 오행 무료로 보기"
      idPrefix="o"
      render={(r) => {
        const max = Math.max(...r.counts.map((c) => c.value), 1);
        return (
          <>
            <h2 className="font-serif text-[21px] font-black">내 사주의 오행 분포</h2>
            <div className="mt-3">
              <PillarGrid pillars={r.pillars} />
            </div>
            {r.timeUnknown && <p className="mt-1 rounded-input border border-gold/20 bg-night/60 p-2 text-xs text-text-sub">{TIME_UNKNOWN_NOTE}</p>}
            <ul className="mt-4 space-y-3">
              {r.counts.map((c) => (
                <li key={c.name} className="rounded-card border border-gold/30 bg-surface p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-serif text-lg font-bold text-gold">{c.name}</h3>
                    <p className="price text-sm">{c.value}</p>
                  </div>
                  <p className="text-xs text-text-sub">{c.image}</p>
                  <div className="mt-2 h-2 rounded-pill bg-night" role="img" aria-label={`${c.name} ${c.value}`}>
                    <div className="h-2 rounded-pill bg-gold" style={{ width: `${Math.round((c.value / max) * 100)}%` }} />
                  </div>
                  {c.note && <p className="mt-2 text-sm">{c.note}</p>}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-text-sub">숫자는 겉으로 보이는 글자와 지지 속 숨은 글자(지장간)를 함께 센 값이에요.{r.missing.length > 0 ? ` 거의 없는 오행: ${r.missing.join(", ")}.` : ""}</p>
          </>
        );
      }}
    />
  );
}

/** 내 일간 알아보기: 일간(갑~계) 한 글자로 보는 기본 성향 */
export function IlganTool() {
  return (
    <FreeShell<FreeIlgan>
      endpoint="/api/free/ilgan"
      event="free_ilgan"
      button="내 일간 무료로 알아보기"
      idPrefix="i"
      showGender={false}
      render={(r) => (
        <>
          <h2 className="font-serif text-[21px] font-black">내 일간은 {r.stem}</h2>
          <p className="mt-1 text-sm text-gold">{r.dayPillar}일주 · {r.element}</p>
          <div className="mt-3">
            <PillarGrid pillars={r.pillars} mark="day" />
          </div>
          {r.timeUnknown && <p className="mt-1 rounded-input border border-gold/20 bg-night/60 p-2 text-xs text-text-sub">{TIME_UNKNOWN_NOTE}</p>}
          <div className="hanji mt-4 rounded-card p-6">
            <p className="text-xs font-bold text-seal">{r.info.image}</p>
            <p className="mt-2 font-display text-xl leading-snug">{r.info.trait}</p>
            <p className="mt-3 text-sm">{r.info.watch}</p>
          </div>
          <p className="mt-2 text-xs text-text-sub">일간은 사주의 &lsquo;나&rsquo;를 뜻하는 글자예요. 전체 사주를 함께 보아야 더 정확해요.</p>
        </>
      )}
    />
  );
}

/** 띠 운세: 내 띠와 올해 지지의 관계, 올해 삼재 여부 */
export function TtiTool() {
  return (
    <FreeShell<FreeTti>
      endpoint="/api/free/tti"
      event="free_tti"
      button="내 띠 무료로 보기"
      idPrefix="t"
      showTime={false}
      showGender={false}
      render={(r) => (
        <>
          <h2 className="font-serif text-[21px] font-black">{r.animal}띠 · {r.year}년 흐름</h2>
          <p className="mt-1 text-sm text-text-sub">올해는 {r.yearPillar}년({r.yearAnimal}해)이에요. 띠는 입춘을 기준으로 정해요.</p>
          <ul className="mt-4 space-y-3">
            {r.relations.length > 0 ? (
              r.relations.map((x) => (
                <li key={x.kind} className="rounded-card border border-gold/30 bg-surface p-4">
                  <h3 className="font-serif text-lg font-bold text-gold">{x.kind}</h3>
                  <p className="mt-1 text-sm">{x.text}</p>
                </li>
              ))
            ) : (
              <li className="rounded-card border border-gold/30 bg-surface p-4 text-sm">올해 지지와 특별한 합·충이 없는 평온한 해다. 평소 하던 대로 꾸준히 가면 된다.</li>
            )}
            <li className="rounded-card border border-gold/30 bg-surface p-4">
              <h3 className="font-serif text-lg font-bold">삼재</h3>
              <p className="mt-1 text-sm">{r.samjae.active ? `올해는 ${r.samjae.phase}에 해당한다. 삼재는 3년 주기 흐름의 이름이며, 차분히 지내라는 뜻으로 보면 된다.` : "올해는 삼재에 해당하지 않는다."}</p>
              {r.samjae.years.length > 0 && <p className="mt-1 text-xs text-text-sub">삼재 해: {r.samjae.years.join("년, ")}년</p>}
            </li>
          </ul>
        </>
      )}
    />
  );
}
