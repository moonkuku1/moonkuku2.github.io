import type { Chart } from "../saju/chart";
import { GROUPS, GROUP_OF_GOD, type Group } from "../signals/context";
import type { TenGod } from "../saju/analysis/elements";

/**
 * P1에 넣는 계산 결과([계산 결과] {chart_json}). 생년월일·시각 같은 개인정보는 넣지 않고, 사주 글자와 분석 값만 보낸다.
 * `candidates`는 AI가 profile.keywords[].basis에 쓸 수 있는 "계산 결과의 요소명" 목록이다(P1 규칙 1).
 */
export type ProfileInput = { json: Record<string, unknown>; candidates: string[] };

const POSITIONS = ["연", "월", "일", "시"] as const;

export function buildProfileInput(chart: Chart): ProfileInput {
  const p = chart.pillars;
  const pillars: Record<string, string | null> = {
    연주: p.year.name,
    월주: p.month.name,
    일주: p.day.name,
    시주: p.hour ? p.hour.name : null,
  };
  const el = chart.elements;
  const candidates: string[] = [];
  const add = (s: string) => candidates.push(s);

  for (const pos of POSITIONS) {
    const v = pillars[`${pos}주`];
    if (v) add(`${pos}주 ${v}`);
  }
  add(`일간 ${el.dayStem}${el.dayElement}`);
  add(`${chart.strength.level}`);
  add(`격국 ${chart.structure.name}`);
  for (const c of el.characters) {
    if (c.stem.god) add(`${c.position}간 ${c.stem.name} ${c.stem.god}`);
    add(`${c.position}지 ${c.branch.name} ${c.branch.god}`);
  }
  for (const [name, n] of Object.entries(el.godCount)) if (n > 0) add(`${name} ${n}개`);
  const groupCounts = Object.fromEntries(GROUPS.map((g) => [g, 0])) as Record<Group, number>;
  for (const [name, n] of Object.entries(el.godCount)) groupCounts[GROUP_OF_GOD[name as TenGod]] += n;
  for (const g of GROUPS) if (groupCounts[g] > 0) add(`${g} ${groupCounts[g]}개`);
  for (const [name, n] of Object.entries(el.withHidden)) if (n >= 1.5) add(`${name} 기운 많음`);
  for (const m of el.missing) add(`${m} 없음`);
  for (const h of chart.yongshin.helpful) add(`도움이 되는 오행 ${h.element}`);
  for (const h of chart.yongshin.avoid) add(`조심할 오행 ${h.element}`);
  for (const r of chart.relations) add(r.label ?? `${r.chars.join("")} ${r.kind}`);
  for (const s of chart.sinsal.hits) add(s.name);
  add(`${chart.majorLuck.direction} 대운`);

  const json = {
    사주: pillars,
    일간: `${el.dayStem}${el.dayElement}`,
    신강신약: { 단계: chart.strength.level, 월령을얻음: chart.strength.deukryeong, 일지가돕는가: chart.strength.deukji },
    격국: chart.structure.name,
    오행분포_지장간포함: el.withHidden,
    십성개수: el.godCount,
    십성무리개수: groupCounts,
    없는오행: el.missing,
    도움이되는오행: chart.yongshin.helpful.map((h) => h.element),
    조심할오행: chart.yongshin.avoid.map((h) => h.element),
    합충형파해원진: chart.relations.map((r) => `${r.places.join("-")} ${r.label ?? r.kind}`),
    신살: chart.sinsal.hits.map((s) => `${s.name}(${s.places.join(",")})`),
    대운: { 방향: chart.majorLuck.direction, 처음세개: chart.majorLuck.periods.slice(0, 3).map((x) => `${x.pillar.name} ${x.startAge}세`) },
    출생시간: chart.pillars.hour ? "있음" : "모름",
    사용가능한_basis: candidates,
  };
  return { json, candidates };
}

