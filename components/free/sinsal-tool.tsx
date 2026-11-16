"use client";
import { FreeShell, PillarGrid, TIME_UNKNOWN_NOTE } from "@/components/free/free-shell";
import type { FreeSinsal } from "@/lib/free-sinsal";

/** 무료 신살 조회: 사주 안의 신살을 찾아 뜻과 함께 보여 주고, 올해 삼재도 알려 준다. */
export function SinsalTool() {
  return (
    <FreeShell<FreeSinsal>
      endpoint="/api/free/sinsal"
      event="free_sinsal"
      button="내 신살 무료로 찾기"
      idPrefix="s"
      render={(r) => (
        <>
          <h2 className="font-serif text-[21px] font-black">내 사주의 신살</h2>
          <div className="mt-3">
            <PillarGrid pillars={r.pillars} />
          </div>
          {r.timeUnknown && <p className="mt-1 rounded-input border border-gold/20 bg-night/60 p-2 text-xs text-text-sub">{TIME_UNKNOWN_NOTE}</p>}

          {r.found.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {r.found.map((s) => (
                <li key={s.name} className="rounded-card border border-gold/30 bg-surface p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="font-serif text-lg font-bold text-gold">{s.name}</h3>
                    <p className="text-xs text-text-sub">{s.where.join(" · ")}</p>
                  </div>
                  <p className="mt-1 text-sm">{s.summary}</p>
                  <p className="mt-1 text-sm text-text-sub">{s.tip}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-card border border-gold/30 bg-surface p-4 text-sm">이 사주에서는 조회 대상 신살이 나오지 않았다. 신살이 없다고 부족한 것은 아니다.</p>
          )}
          {r.absent.length > 0 && <p className="mt-3 text-xs text-text-sub">나오지 않은 신살: {r.absent.join(", ")}</p>}

          <div className="mt-4 rounded-card border border-gold/30 bg-surface p-4">
            <h3 className="font-serif text-lg font-bold">{r.samjae.year}년 삼재</h3>
            <p className="mt-1 text-sm">
              {r.samjae.active ? `올해는 ${r.samjae.phase}에 해당한다. 삼재는 3년 주기로 오는 흐름의 이름이며, 차분히 지내라는 뜻으로 보면 된다.` : "올해는 삼재에 해당하지 않는다."}
            </p>
            {r.samjae.years.length > 0 && <p className="mt-1 text-xs text-text-sub">삼재 해: {r.samjae.years.join("년, ")}년</p>}
          </div>
        </>
      )}
    />
  );
}
