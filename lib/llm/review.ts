import type { Verdict } from "../verdict/types";
import type { GuideId } from "./guide";
import type { Answer, Profile } from "./schemas";

/**
 * P5 코드 검수 (요구사항 3.6): 매번 한다.
 * JSON 모양은 schemas.ts가 먼저 확인하고, 여기서는 근거 칩, 판정 값, 글자 수, 금지어, 말투, 안전 문장을 본다.
 * 하나라도 어기면 `problems`에 이유가 담긴다. 호출하는 쪽이 한 번 다시 만들고, 또 어기면 운영자에게 알린다.
 */
export type ReviewResult = { ok: boolean; problems: string[] };

// ───────── 금지어 ─────────
const FORBIDDEN_PHRASES = [
  "죽음", "죽는", "사망", "저주", "반드시 이혼", "필연적 불행", "불행해집니다", "불행해져요", "반드시 이별", "이별수",
  "운명이 당신을 기다립니다", "지금 확인하지 않으면", "후회하게 됩니다", "후회하게 돼요", "파멸", "망합니다", "망해요",
  "BEST", "베스트", "후기", "평점", "별점", "적중률", "누적", "만 명이", "수상",
];
/** ‘돈’ 대신 ‘재물’ (디자인 문구 규칙). 돈독·돈 사 등 다른 낱말은 걸리지 않게 조사가 붙은 형태만 본다. */
const MONEY_WORD = /(^|[^가-힣])돈(?=[이은을도만과와의으에,.\s]|$)|큰돈|푼돈/;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const ASSERTIVE = /(반드시|틀림없이|무조건|100%|확실히|절대)/;

// ───────── 글자 수 ─────────
/** 기준 문서는 story 350~500자(신년운세 600~900자)다. 모델이 글자 수를 정확히 세지 못하므로 ±10%까지 받아 준다. */
export const STORY_RANGE = { normal: [315, 550], yearly: [540, 990] } as const;
const len = (s: string) => Array.from(s).length;

// ───────── 판정 값이 headline에 들어 있는지 ─────────
const CUE = {
  예: /(네|가능|좋|열려|괜찮|해도|맞|유력|밝|순조|이어|있어|돼|된다|하여라|해 보)/,
  아니오: /(아니|어렵|이르|쉬[어고는]|미루|피하|서두르지|조심|아직|말아|않)/,
  조건부: /(조건|다만|따라|상황|라면|신중|맞으면|맞춰|갖추|살펴|조건부)/,
  상: /(좋|풍성|넉넉|유리|밝|상)/,
  중: /(보통|무난|중간|평범|고르|그럭)/,
  하: /(조심|아쉬|어렵|주의|약한|낮|쉬어|서두르지)/,
} as const;

function months(list: { month: number }[]) {
  return [...new Set(list.map((m) => m.month))];
}

export function headlineProblems(v: Verdict, headline: string): string[] {
  const out: string[] = [];
  const val = v.value;
  const needMonths = (ms: number[], what: string) => {
    for (const m of ms) if (!headline.includes(`${m}월`)) out.push(`headline에 ${what} ${m}월이 없어요`);
  };
  const needYears = (ys: number[], what: string) => {
    for (const y of ys) if (!headline.includes(String(y))) out.push(`headline에 ${what} ${y}년이 없어요`);
  };
  switch (val.kind) {
    case "timing-month":
      needMonths(months(val.picks), "판정 시기");
      break;
    case "timing-year":
      needYears(val.picks.map((p) => p.year), "판정 시기");
      break;
    case "best-worst-month":
      needMonths([val.best[0].month, val.worst[0].month], "좋은/조심할 달");
      break;
    case "best-worst-year":
      needYears([val.best[0].year, val.worst[0].year], "좋은/조심할 해");
      break;
    case "monthly-graph":
      needMonths([val.best[0].month, val.worst[0].month], "좋은/조심할 달");
      break;
    case "yesno":
      if (!CUE[val.answer].test(headline)) out.push(`headline이 판정(${val.answer})을 말하지 않아요`);
      break;
    case "yesno+timing-month":
      if (!CUE[val.answer].test(headline)) out.push(`headline이 판정(${val.answer})을 말하지 않아요`);
      needMonths(months(val.picks), "판정 시기");
      break;
    case "grade":
      if (!CUE[val.grade].test(headline)) out.push(`headline이 등급(${val.grade})을 말하지 않아요`);
      break;
    case "score":
      if (!headline.includes(String(val.score))) out.push(`headline에 점수 ${val.score}가 없어요`);
      break;
    default:
      break;
  }
  return out;
}

// ───────── 말투 (요구사항 4.10-3) ─────────
function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((s) => s.trim().replace(/[.!?。"'”’)\]]+$/g, ""))
    .filter((s) => s.length >= 2);
}
const endsYo = (s: string) => /요$/.test(s);
const endsFormal = (s: string) => /(니다|지요|십시오|소서)$/.test(s);

export function voiceProblems(guide: GuideId, texts: string[]): string[] {
  const sentences = texts.flatMap(sentencesOf);
  if (sentences.length < 3) return [];
  const n = sentences.length;
  const yo = sentences.filter(endsYo).length;
  const formal = sentences.filter(endsFormal).length;
  const hasNida = sentences.filter((s) => /니다$/.test(s)).length;
  const out: string[] = [];
  if (guide === "assi") {
    if (yo / n < 0.7) out.push("삼백 아씨의 말투(~해요)로 쓰지 않았어요");
    if (hasNida > 0) out.push('삼백 아씨는 "~습니다"를 쓰지 않아요');
  } else if (guide === "doryeong") {
    if (formal / n < 0.7) out.push("삼백 도령의 말투(~습니다·~지요)로 쓰지 않았어요");
    const casualYo = sentences.filter((s) => endsYo(s) && !/지요$/.test(s)).length;
    if (casualYo / n > 0.15) out.push('삼백 도령은 "~해요"체를 쓰지 않아요');
  } else {
    if ((yo + hasNida) / n > 0.1) out.push('해치 삼백이는 "~요"나 "~습니다"로 끝내지 않아요(옛말투 반말)');
  }
  return out;
}

// ───────── 낱말 검사 ─────────
function mentionedNumbers(text: string) {
  const ms = [...text.matchAll(/(?<![\d])(\d{1,2})월/g)].map((m) => Number(m[1]));
  const ys = [...text.matchAll(/(20\d{2})년/g)].map((m) => Number(m[1]));
  return { ms, ys };
}

function allowedTimes(v: Verdict) {
  const val = v.value;
  const monthsSet = new Set<number>();
  const yearsSet = new Set<number>([v.reference.year, v.reference.year + 1]);
  const addM = (l: { month: number; sajuYear: number }[]) =>
    l.forEach((m) => {
      monthsSet.add(m.month);
      yearsSet.add(m.sajuYear);
    });
  const addY = (l: { year: number }[]) => l.forEach((y) => yearsSet.add(y.year));
  let anyMonth = false;
  switch (val.kind) {
    case "timing-month":
    case "yesno+timing-month":
      addM(val.picks);
      break;
    case "best-worst-month":
      addM(val.best);
      addM(val.worst);
      break;
    case "timing-year":
      addY(val.picks);
      break;
    case "best-worst-year":
      addY(val.best);
      addY(val.worst);
      break;
    case "monthly-graph":
      anyMonth = true;
      addM(val.months);
      break;
    default:
      break;
  }
  return { monthsSet, yearsSet, anyMonth };
}

export type ReviewInput = {
  guide: GuideId;
  verdict: Verdict;
  yearly: boolean;
  timeUnknown: boolean;
};

export function reviewAnswer(a: Answer, input: ReviewInput): ReviewResult {
  const { verdict: v, guide } = input;
  const problems: string[] = [];

  // 1) 판정이 headline에 그대로 들어 있어야 한다
  problems.push(...headlineProblems(v, a.headline));

  // 2) 근거 칩은 지지 신호의 label만
  const labels = new Set(v.signalsFor.map((s) => s.label));
  const seen = new Set<string>();
  for (const e of a.evidence) {
    if (!labels.has(e.chip)) problems.push(`근거 칩이 지지 신호에 없어요: ${e.chip}`);
    if (seen.has(e.chip)) problems.push(`근거 칩이 겹쳐요: ${e.chip}`);
    seen.add(e.chip);
  }
  const minEvidence = Math.min(2, labels.size);
  if (a.evidence.length < minEvidence) problems.push(`근거 칩이 ${minEvidence}개 이상이어야 해요`);
  if (labels.size === 0 && a.evidence.length > 0) problems.push("지지 신호가 없는데 근거 칩이 있어요");

  // 3) 글자 수
  const [lo, hi] = input.yearly ? STORY_RANGE.yearly : STORY_RANGE.normal;
  const storyLen = len(a.story);
  if (storyLen < lo || storyLen > hi) problems.push(`story 글자 수가 ${lo}~${hi}자를 벗어났어요 (${storyLen}자)`);

  // 4) 반대 신호 / 확신도 메모
  if (v.signalsAgainst.length === 0 && a.counter !== "") problems.push("반대 신호가 없는데 counter가 있어요");
  if (v.signalsAgainst.length > 0 && len(a.counter) < 5) problems.push("반대 신호가 있는데 counter가 비었어요");
  const needNote = v.confidence === "약" || input.timeUnknown;
  if (needNote && a.confidenceNote === "") problems.push("확신도가 약이거나 출생시간이 없는데 confidenceNote가 비었어요");
  if (!needNote && a.confidenceNote !== "") problems.push("confidenceNote는 확신도가 약이거나 출생시간이 없을 때만 써요");

  // 5) 신년·월별(P4)
  if (input.yearly) {
    if (!a.months) problems.push("신년운세는 months 12개가 필요해요");
    else if (v.value.kind === "monthly-graph") {
      const want = v.value.months.map((m) => m.label);
      a.months.forEach((m, i) => {
        if (m.month !== want[i]) problems.push(`months[${i}]가 ${want[i]}이어야 해요`);
      });
    }
  } else if (a.months) problems.push("신년운세가 아니면 months를 쓰지 않아요");

  // 6) 안전: 건강·임신·투자·법률은 단정하지 않고 전문가 상담을 권한다
  const body = [a.story, a.action.do, a.avoid, a.counter, a.headline].join("\n");
  if (v.safety.consult.length > 0 && !/(전문가|상담)/.test(`${a.story}\n${a.action.do}`)) {
    problems.push(`${v.safety.consult.join("·")} 관련이라 전문가 상담을 권하는 문장이 필요해요`);
  }
  if (v.safety.noAssertion && ASSERTIVE.test(body)) problems.push("단정 금지 질문인데 단정하는 표현이 있어요");

  // 7) 금지어·표현 규칙
  const all = [a.headline, a.story, a.counter, a.action.do, a.action.by, a.avoid, a.confidenceNote, ...a.evidence.map((e) => e.why), ...(a.months ?? []).map((m) => m.line)].join("\n");
  for (const w of FORBIDDEN_PHRASES) if (all.includes(w)) problems.push(`쓰지 않는 말이 있어요: ${w}`);
  if (MONEY_WORD.test(all)) problems.push("‘돈’ 대신 ‘재물’을 써요");
  if (EMOJI.test(all)) problems.push("이모지는 쓰지 않아요");
  if (/!/.test(all)) problems.push("감탄사(느낌표)는 쓰지 않아요");
  if (/\{|\}|undefined|null/.test(all)) problems.push("채워지지 않은 자리표시가 남아 있어요");

  // 8) 계산값에 없는 시기
  const t = allowedTimes(v);
  const spoken = mentionedNumbers([a.headline, a.story, a.counter, a.avoid, ...a.evidence.map((e) => e.why)].join("\n"));
  if (!t.anyMonth) {
    for (const m of new Set(spoken.ms)) if (!t.monthsSet.has(m)) problems.push(`계산값에 없는 시기를 말했어요: ${m}월`);
  }
  for (const y of new Set(spoken.ys)) if (!t.yearsSet.has(y)) problems.push(`계산값에 없는 시기를 말했어요: ${y}년`);

  // 9) 말투
  problems.push(...voiceProblems(guide, [a.headline, a.story, a.counter, a.action.do, a.avoid, a.confidenceNote, ...a.evidence.map((e) => e.why)]));

  return { ok: problems.length === 0, problems };
}

/** P1 프로필 코드 검수: basis는 계산 결과에 있는 요소만, 해요체, 금지어 */
export function reviewProfile(p: Profile, candidates: string[]): ReviewResult {
  const problems: string[] = [];
  const norm = (s: string) => s.replace(/\s+/g, "");
  const cand = candidates.map(norm);
  for (const k of p.keywords) {
    for (const b of k.basis) {
      const nb = norm(b);
      if (nb.length < 2 || !cand.some((c) => c.includes(nb) || nb.includes(c))) problems.push(`basis가 계산 결과에 없어요: ${b}`);
    }
  }
  if (new Set(p.keywords.map((k) => k.word)).size !== 3) problems.push("키워드가 서로 달라야 해요");
  const all = [p.theme, p.strength, p.watch, p.shareLine, ...p.keywords.map((k) => `${k.word}\n${k.line}`)].join("\n");
  for (const w of FORBIDDEN_PHRASES) if (all.includes(w)) problems.push(`쓰지 않는 말이 있어요: ${w}`);
  if (MONEY_WORD.test(all)) problems.push("‘돈’ 대신 ‘재물’을 써요");
  if (EMOJI.test(all) || /!/.test(all)) problems.push("이모지·감탄사는 쓰지 않아요");
  const sentences = [p.strength, p.watch, ...p.keywords.map((k) => k.line)].flatMap(sentencesOf);
  if (sentences.length && sentences.filter(endsYo).length / sentences.length < 0.7) problems.push('프로필은 "~해요"체로 써요');
  return { ok: problems.length === 0, problems };
}

