import { monthLuck } from "../saju/analysis/luck";
import type { Chart } from "../saju/chart";
import { findTerm, minutesOf, TABLE_FIRST_YEAR, TABLE_LAST_YEAR } from "../saju/solar-terms";
import { GROUPS, buildContext, type Group, type SignalContext } from "../signals/context";
import { SIGNAL_BY_KEY } from "../signals/library";
import { resolveRecipe } from "./recipes";
import type {
  Confidence,
  MonthPick,
  Recipe,
  Safety,
  SignalHit,
  SignalRef,
  Verdict,
  VerdictValue,
  YearPick,
} from "./types";

/**
 * 판정 엔진 (요구사항 2.4~2.8): 같은 명식 + 같은 질문 + 같은 기준 연월이면 항상 같은 결과.
 * 판정·확신도·시기는 여기서 정하고, AI는 이 값을 바꾸지 못한다.
 */
export type Reference = { year: number; month: number };

// ───────── 점수 계산 ─────────
type Scored = { net: number; hits: SignalHit[]; support: SignalHit[]; against: SignalHit[] };

function evaluate(signals: SignalRef[], ctx: SignalContext): Scored {
  const support: SignalHit[] = [];
  const against: SignalHit[] = [];
  for (const s of signals) {
    const def = SIGNAL_BY_KEY.get(s.key)!;
    if (!def.test(ctx)) continue;
    const hit: SignalHit = { key: def.key, label: def.label, plain: def.plain, weight: s.weight, scope: def.scope };
    (s.dir === "+" ? support : against).push(hit);
  }
  const sum = (l: SignalHit[]) => l.reduce((n, h) => n + h.weight, 0);
  return { net: sum(support) - sum(against), hits: [...support, ...against], support, against };
}

/** 지지 신호 합 − 반대 신호 합으로 확신도를 정한다: 5 이상 강, 2~4 중, 1 이하 약 (요구사항 2.5) */
export function confidenceOf(net: number): Confidence {
  if (net >= 5) return "강";
  if (net >= 2) return "중";
  return "약";
}
const LEVELS: Confidence[] = ["약", "중", "강"];
const lower = (c: Confidence): Confidence => LEVELS[Math.max(0, LEVELS.indexOf(c) - 1)];

// ───────── 기준 시점 ─────────
function sajuYearAt(ref: Reference): number {
  const instant = Date.UTC(ref.year, ref.month - 1, 15, 12, 0) / 60000;
  return findTerm(ref.year, "입춘").minutes <= instant ? ref.year : ref.year - 1;
}

type MonthEntry = { label: string; year: number; month: number; sajuYear: number; order: number; term: string; date: string; startMinutes: number };

/** 기준 시점부터 앞으로 n개의 월운(절기 기준 달) */
function monthWindow(ref: Reference, n: number): MonthEntry[] {
  const sy = sajuYearAt(ref);
  if (sy - 1 < TABLE_FIRST_YEAR || sy + 2 > TABLE_LAST_YEAR) throw new Error("기준 연월이 지원 범위(1900~2100년)를 벗어났어요.");
  const all: MonthEntry[] = [];
  for (const y of [sy - 1, sy, sy + 1]) {
    for (const m of monthLuck(y)) {
      const [yy, mm] = m.date.split("-").map(Number);
      all.push({ label: `${yy}-${String(mm).padStart(2, "0")}`, year: yy, month: mm, sajuYear: y, order: m.order, term: m.term, date: m.date, startMinutes: minutesOf(m.date, m.time) });
    }
  }
  all.sort((a, b) => a.startMinutes - b.startMinutes);
  const instant = Date.UTC(ref.year, ref.month - 1, 15, 12, 0) / 60000;
  let idx = 0;
  all.forEach((e, i) => {
    if (e.startMinutes <= instant) idx = i;
  });
  return all.slice(idx, idx + n);
}

function scoreMonths(chart: Chart, recipe: Recipe, window: MonthEntry[]) {
  return window.map((e) => {
    const sc = evaluate(recipe.signals, buildContext(chart, e.sajuYear, e.order));
    const pick: MonthPick = { label: e.label, year: e.year, month: e.month, sajuYear: e.sajuYear, order: e.order, term: e.term, date: e.date, score: sc.net };
    return { pick, sc };
  });
}

function scoreYears(chart: Chart, recipe: Recipe, from: number, n: number) {
  return Array.from({ length: n }, (_, i) => from + i).map((y) => {
    const sc = evaluate(recipe.signals, buildContext(chart, y));
    return { pick: { year: y, score: sc.net } as YearPick, sc };
  });
}

/** 점수 높은 순(같으면 시간 순)으로 위에서 n개 */
const topN = <T extends { pick: { score: number } }>(list: T[], n: number, desc = true) =>
  [...list]
    .map((x, i) => ({ x, i }))
    .sort((a, b) => (desc ? b.x.pick.score - a.x.pick.score : a.x.pick.score - b.x.pick.score) || a.i - b.i)
    .slice(0, n)
    .map((v) => v.x);

// ───────── 안전 장치 (요구사항 3.11) ─────────
const CONSULT_WORDS: Record<"의료" | "법률" | "투자", RegExp> = {
  의료: /(임신|출산|건강|질병|수술|병원|성별|유산)/,
  법률: /(소송|법적|재판|이혼|보증|계약|상속)/,
  투자: /(투자|주식|코인|펀드|부동산|대출|빚)/,
};

export function safetyOf(question: { title: string; note: string }, recipe: Recipe): Safety {
  const consult = new Set<"의료" | "법률" | "투자">();
  for (const s of recipe.safety) {
    const m = s.match(/^consult:(의료|법률|투자)$/);
    if (m) consult.add(m[1] as "의료" | "법률" | "투자");
  }
  for (const k of Object.keys(CONSULT_WORDS) as ("의료" | "법률" | "투자")[]) if (CONSULT_WORDS[k].test(`${question.title} ${question.note}`)) consult.add(k);
  return {
    noAssertion: recipe.safety.includes("no-assertion") || /단정/.test(question.note) || consult.size > 0,
    consult: [...consult],
  };
}

// ───────── 판정 ─────────
function dominantGroup(chart: Chart): Group {
  const counts = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 } as Record<Group, number>;
  const ctx = buildContext(chart, sajuYearAt({ year: chart.solarDate.year, month: 6 }));
  for (const g of GROUPS) counts[g] = ctx.d.counts[g];
  // 같으면 비겁 → 식상 → 재성 → 관성 → 인성 순
  return GROUPS.reduce((best, g) => (counts[g] > counts[best] ? g : best), GROUPS[0]);
}

export function yesNo(net: number, yesAt: number, noAt: number): "예" | "아니오" | "조건부" {
  if (net >= yesAt) return "예";
  if (net <= noAt) return "아니오";
  return "조건부";
}

/** 이 판정에서 확신도를 정할 점수: 판정 방향으로 얼마나 기울었는지 */
export function directedNet(answer: string, net: number): number {
  if (answer === "예" || answer === "상") return net;
  if (answer === "아니오" || answer === "하") return -net;
  return Math.min(net, 1); // 조건부·중간은 확신하기 어렵다
}

export function judge(chart: Chart, questionId: string, ref: Reference): Verdict {
  const { recipe, question } = resolveRecipe(questionId);
  const sy = sajuYearAt(ref);
  const rule = recipe.rule;

  let value: VerdictValue;
  let net = 0;
  let forHits: SignalHit[] = [];
  let againstHits: SignalHit[] = [];
  let closeGap = false;

  const monthCtxAtRef = () => {
    const e = monthWindow(ref, 1)[0];
    return buildContext(chart, e.sajuYear, e.order);
  };
  const ctxFor = (at: "year" | "month" | undefined) => (at === "month" ? monthCtxAtRef() : buildContext(chart, sy));

  switch (rule.kind) {
    case "needs-partner":
      value = { kind: "needs-partner" };
      break;

    case "timing-month": {
      const scored = scoreMonths(chart, recipe, monthWindow(ref, rule.months ?? 12));
      const top = topN(scored, rule.top ?? 2);
      value = { kind: "timing-month", picks: top.map((t) => t.pick), scores: scored.map((s) => s.pick) };
      net = top[0].sc.net;
      forHits = top[0].sc.support;
      againstHits = top[0].sc.against;
      const third = topN(scored, 3)[2];
      closeGap = !!third && top[0].pick.score - third.pick.score <= (rule.closeGap ?? 1);
      break;
    }

    case "timing-year": {
      const scored = scoreYears(chart, recipe, sy, rule.years ?? 7);
      const top = topN(scored, rule.top ?? 2);
      value = { kind: "timing-year", picks: top.map((t) => t.pick), scores: scored.map((s) => s.pick) };
      net = top[0].sc.net;
      forHits = top[0].sc.support;
      againstHits = top[0].sc.against;
      const third = topN(scored, 3)[2];
      closeGap = !!third && top[0].pick.score - third.pick.score <= (rule.closeGap ?? 1);
      break;
    }

    case "best-worst-month": {
      const scored = scoreMonths(chart, recipe, monthWindow(ref, rule.months ?? 12));
      const best = topN(scored, rule.top ?? 2);
      const worst = topN(scored, rule.top ?? 2, false);
      value = { kind: "best-worst-month", best: best.map((b) => b.pick), worst: worst.map((w) => w.pick), scores: scored.map((s) => s.pick) };
      net = best[0].sc.net;
      forHits = best[0].sc.support;
      againstHits = worst[0].sc.against; // 조심할 달의 반대 신호를 반대 신호로 보여 준다
      break;
    }

    case "best-worst-year": {
      const scored = scoreYears(chart, recipe, sy, rule.years ?? 7);
      const best = topN(scored, rule.top ?? 2);
      const worst = topN(scored, rule.top ?? 2, false);
      value = { kind: "best-worst-year", best: best.map((b) => b.pick), worst: worst.map((w) => w.pick), scores: scored.map((s) => s.pick) };
      net = best[0].sc.net;
      forHits = best[0].sc.support;
      againstHits = worst[0].sc.against;
      break;
    }

    case "yesno": {
      const sc = evaluate(recipe.signals, ctxFor(rule.at));
      const answer = yesNo(sc.net, rule.yesAt, rule.noAt);
      value = { kind: "yesno", answer, net: sc.net };
      net = directedNet(answer, sc.net);
      forHits = sc.support;
      againstHits = sc.against;
      break;
    }

    case "yesno+timing-month": {
      const sc = evaluate(recipe.signals, buildContext(chart, sy));
      const answer = yesNo(sc.net, rule.yesAt, rule.noAt);
      const scored = scoreMonths(chart, recipe, monthWindow(ref, rule.months ?? 12));
      const top = topN(scored, rule.top ?? 2);
      value = { kind: "yesno+timing-month", answer, net: sc.net, picks: top.map((t) => t.pick), scores: scored.map((s) => s.pick) };
      net = directedNet(answer, top[0].sc.net);
      forHits = top[0].sc.support;
      againstHits = top[0].sc.against;
      const third = topN(scored, 3)[2];
      closeGap = !!third && top[0].pick.score - third.pick.score <= (rule.closeGap ?? 1);
      break;
    }

    case "grade": {
      const sc = evaluate(recipe.signals, ctxFor(rule.at));
      const grade = sc.net >= rule.highAt ? "상" : sc.net >= rule.midAt ? "중" : "하";
      value = { kind: "grade", grade, net: sc.net };
      net = directedNet(grade, sc.net);
      forHits = sc.support;
      againstHits = sc.against;
      break;
    }

    case "score": {
      const sc = evaluate(recipe.signals, ctxFor(rule.at));
      const score = Math.max(0, Math.min(100, 50 + 8 * sc.net));
      const grade = score >= 70 ? "상" : score >= 45 ? "중" : "하";
      value = { kind: "score", score, grade, net: sc.net };
      net = directedNet(grade, sc.net);
      forHits = sc.support;
      againstHits = sc.against;
      break;
    }

    case "profile": {
      const sc = evaluate(recipe.signals, buildContext(chart, sy));
      value = {
        kind: "profile",
        dominantGroup: dominantGroup(chart),
        strengthLevel: chart.strength.level,
        structure: chart.structure.name,
        helpfulElements: chart.yongshin.helpful.map((h) => h.element),
        avoidElements: chart.yongshin.avoid.map((h) => h.element),
        net: sc.net,
      };
      net = sc.net;
      forHits = sc.support;
      againstHits = sc.against;
      break;
    }

    case "cause": {
      const sc = evaluate(recipe.signals, buildContext(chart, sy));
      const causes = [...sc.against].sort((a, b) => b.weight - a.weight).slice(0, rule.top ?? 3);
      value = { kind: "cause", causes, net: sc.net };
      net = sc.against.reduce((n, h) => n + h.weight, 0) - sc.support.reduce((n, h) => n + h.weight, 0);
      forHits = sc.against; // 원인 질문에서는 '지지 신호'가 곧 원인 신호다
      againstHits = sc.support;
      break;
    }

    case "monthly-graph": {
      const scored = scoreMonths(chart, recipe, monthWindow(ref, rule.months ?? 12));
      const best = topN(scored, rule.top ?? 2);
      const worst = topN(scored, rule.top ?? 2, false);
      const yearSc = evaluate(recipe.signals, buildContext(chart, sy));
      value = { kind: "monthly-graph", months: scored.map((s) => s.pick), best: best.map((b) => b.pick), worst: worst.map((w) => w.pick), yearNet: yearSc.net };
      net = yearSc.net;
      forHits = yearSc.support;
      againstHits = yearSc.against;
      break;
    }
  }

  const notes: Verdict["confidenceNotes"] = [];
  let confidence = confidenceOf(net);
  if (closeGap) {
    confidence = lower(confidence);
    notes.push("close-gap");
  }
  if (chart.lowerConfidence) {
    confidence = lower(confidence);
    notes.push("time-unknown");
  }
  // 궁합처럼 판정을 못 하는 경우는 확신도를 말하지 않는다
  if (value.kind === "needs-partner") confidence = "약";

  return {
    questionId,
    recipeId: recipe.id,
    recipeSource: recipe.source,
    verdictType: recipe.verdictType,
    value,
    confidence,
    confidenceNet: net,
    confidenceNotes: notes,
    signalsFor: forHits,
    signalsAgainst: againstHits,
    safety: safetyOf(question, recipe),
    risk: !!recipe.risk,
    reference: ref,
  };
}



