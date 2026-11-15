import type { Chart } from "../saju/chart";
import { GROUPS, GROUP_OF_GOD, type Group } from "../signals/context";
import type { TenGod } from "../saju/analysis/elements";
import { categoryNameOf, questionRow, type GuideId } from "./guide";
import type { Answer, Profile } from "./schemas";
import type { Verdict } from "../verdict/types";

/**
 * 샘플 문장 모드 (요구사항 3.9): AI 키가 없어도 화면 흐름을 끝까지 볼 수 있게, 계산값으로 정해진 틀에 문장을 채운다.
 * 판정·근거 칩·확신도는 실제 계산값이고, 해석 문장만 틀에서 나온 예시다. 결과 화면에 "샘플 문장"이라고 표시해야 한다.
 */
type Tri = [string, string, string];
const idx = (g: GuideId) => (g === "assi" ? 0 : g === "doryeong" ? 1 : 2);
const t = (g: GuideId, tri: Tri) => tri[idx(g)];

// ───────── P1: 프로필 ─────────
const GROUP_KEYWORD: Record<Group, { word: string; line: string }> = {
  비겁: { word: "나란히 걷는 사람", line: "나와 비슷한 기운이 많아서 동료와 어깨를 나란히 할 때 힘이 나요." },
  식상: { word: "표현하는 사람", line: "하고 싶은 말과 재능을 밖으로 꺼내면서 사람과 가까워져요." },
  재성: { word: "현실을 챙기는 사람", line: "사람 사이에서도 실속과 약속을 먼저 챙기는 편이에요." },
  관성: { word: "책임지는 사람", line: "맡은 역할과 약속을 무겁게 여기면서 신뢰를 쌓아요." },
  인성: { word: "품어 주는 사람", line: "배우고 이해하면서 상대를 천천히 받아들이는 편이에요." },
};

const STRUCTURE_KEYWORD: Record<string, { word: string; line: string }> = {
  정관격: { word: "틀 안의 안정", line: "정해진 틀과 책임 안에서 안정적으로 성과를 내요." },
  편관격: { word: "도전하는 추진력", line: "압박이 있는 상황에서 오히려 결단력이 살아나요." },
  정인격: { word: "배움의 바탕", line: "배우고 준비하는 과정에서 힘을 얻으며 일해요." },
  편인격: { word: "남다른 안목", line: "남과 다른 시각과 감각으로 일을 풀어 가요." },
  식신격: { word: "꾸준한 솜씨", line: "손에 익은 일을 꾸준히 다듬어서 결과를 내요." },
  상관격: { word: "날카로운 표현력", line: "말과 아이디어로 판을 바꾸는 데 재능이 있어요." },
  정재격: { word: "차곡차곡 쌓기", line: "수입과 지출을 꼼꼼히 챙기며 재물을 꾸준히 쌓는 편이에요." },
  편재격: { word: "큰 판을 읽는 눈", line: "기회를 보고 움직이면서 재물의 흐름을 넓게 읽어요." },
  건록격: { word: "스스로 세우는 힘", line: "자기 힘으로 일을 세우고 이끄는 편이에요." },
  양인격: { word: "강한 결단", line: "밀어붙이는 힘이 커서 결단이 필요한 일에 강해요." },
  월겁격: { word: "함께 가는 일", line: "동료와 나눠 가며 일을 풀 때 힘이 나요." },
};

function groupCounts(chart: Chart): Record<Group, number> {
  const c = Object.fromEntries(GROUPS.map((g) => [g, 0])) as Record<Group, number>;
  for (const [name, n] of Object.entries(chart.elements.godCount)) c[GROUP_OF_GOD[name as TenGod]] += n;
  return c;
}
export function dominantGroupOf(chart: Chart): Group {
  const c = groupCounts(chart);
  return GROUPS.reduce((best, g) => (c[g] > c[best] ? g : best), GROUPS[0]);
}

export function sampleProfile(chart: Chart): Profile {
  const el = chart.elements;
  const level = chart.strength.level;
  const gc = groupCounts(chart);
  const dom = dominantGroupOf(chart);

  const k1 =
    level === "신강" || level === "극신강"
      ? { word: "주도하는 힘", line: "나를 돕는 기운이 단단해서 스스로 방향을 정하고 밀고 나가요." }
      : level === "중화"
        ? { word: "균형 감각", line: "나를 돕는 기운과 쓰는 기운이 비슷해서 상황에 맞춰 힘을 조절해요." }
        : { word: "섬세한 수용", line: "혼자 밀어붙이기보다 주변의 도움을 받아 힘을 얻는 편이에요." };
  const k2 = GROUP_KEYWORD[dom];
  const k3 = STRUCTURE_KEYWORD[chart.structure.name];

  const watch =
    level === "신강" || level === "극신강"
      ? "밀어붙이다 주변 의견을 놓치기 쉬우니 한 번 멈춰서 들어 보세요."
      : level === "중화"
        ? "균형을 맞추느라 결정이 늦어질 수 있으니 기한을 정해 두세요."
        : "혼자 짊어지다 지치기 쉬우니 도움을 청하는 연습이 필요해요.";

  const shareLine = `${k1.word} · ${k2.word}`;
  return {
    keywords: [
      { word: k1.word, line: k1.line, basis: [`일간 ${el.dayStem}${el.dayElement}`, level] },
      { word: k2.word, line: k2.line, basis: [`${dom} ${gc[dom]}개`] },
      { word: k3.word, line: k3.line, basis: [`격국 ${chart.structure.name}`] },
    ],
    theme: `${k1.word}, ${k3.word}`.slice(0, 30),
    strength: `‘${k3.word}’에서 나오는 꾸준함이 가장 큰 강점이에요.`,
    watch,
    shareLine: shareLine.length <= 20 ? shareLine : k1.word,
  };
}

// ───────── P2: 답변 ─────────
const mm = (m: { month: number }) => `${m.month}월`;
const yy = (y: { year: number }) => `${y.year}년`;
const uniq = <T,>(list: T[], key: (x: T) => string) => {
  const seen = new Set<string>();
  return list.filter((x) => (seen.has(key(x)) ? false : (seen.add(key(x)), true)));
};

export function sampleHeadline(v: Verdict, g: GuideId): string {
  const val = v.value;
  switch (val.kind) {
    case "timing-month": {
      const ms = uniq(val.picks, mm).map(mm);
      return ms.length === 1
        ? t(g, [`${ms[0]}이 가장 유력해요.`, `${ms[0]}이 가장 유력합니다.`, `${ms[0]}이 으뜸이다.`])
        : t(g, [`${ms[0]}과 ${ms[1]}이 가장 유력해요.`, `${ms[0]}과 ${ms[1]}이 가장 유력합니다.`, `${ms[0]}이 으뜸이다. ${ms[1]}이 뒤를 잇는다.`]);
    }
    case "timing-year": {
      const ys = uniq(val.picks, yy).map(yy);
      return ys.length === 1
        ? t(g, [`${ys[0]}이 가장 유력해요.`, `${ys[0]}이 가장 유력합니다.`, `${ys[0]}이 으뜸이다.`])
        : t(g, [`${ys[0]}과 ${ys[1]}이 가장 유력해요.`, `${ys[0]}과 ${ys[1]}이 가장 유력합니다.`, `${ys[0]}이 으뜸이다. ${ys[1]}이 뒤를 잇는다.`]);
    }
    case "best-worst-month":
    case "monthly-graph": {
      const b = mm(val.best[0]);
      const w = mm(val.worst[0]);
      return t(g, [`${b}이 가장 좋고, ${w}은 조심해요.`, `${b}이 가장 좋고, ${w}은 조심하시지요.`, `${b}이 으뜸이다. ${w}은 조심하여라.`]);
    }
    case "best-worst-year": {
      const b = yy(val.best[0]);
      const w = yy(val.worst[0]);
      return t(g, [`${b}이 가장 좋고, ${w}은 조심해요.`, `${b}이 가장 좋고, ${w}은 조심하시지요.`, `${b}이 으뜸이다. ${w}은 조심하여라.`]);
    }
    case "yesno": {
      if (val.answer === "예") return t(g, ["네, 지금은 흐름이 열려 있어요.", "예, 지금은 흐름이 열려 있습니다.", "그렇다. 지금은 흐름이 열려 있도다."]);
      if (val.answer === "아니오") return t(g, ["지금은 쉬어 가는 쪽이 좋아요.", "지금은 쉬어 가는 쪽이 낫습니다.", "지금은 쉬어 가는 쪽이 낫다."]);
      return t(g, ["조건이 맞으면 가능해요.", "조건이 맞으면 가능합니다.", "조건이 맞으면 가능하니라."]);
    }
    case "yesno+timing-month": {
      const ms = uniq(val.picks, mm).map(mm);
      const both = ms.length === 1 ? ms[0] : `${ms[0]}과 ${ms[1]}`;
      if (val.answer === "예") return t(g, [`네, ${both}이 유력해요.`, `예, ${both}이 유력합니다.`, `그렇다. ${both}이 유력하니라.`]);
      if (val.answer === "아니오") return t(g, [`지금은 쉬고 ${both}을 보세요.`, `지금은 쉬고 ${both}을 보시지요.`, `지금은 쉬고 ${both}을 보아라.`]);
      return t(g, [`조건이 맞으면 ${both}이 유력해요.`, `조건이 맞으면 ${both}이 유력합니다.`, `조건이 맞으면 ${both}이 유력하니라.`]);
    }
    case "grade":
      return val.grade === "상"
        ? t(g, ["지금 흐름이 좋은 편이에요.", "지금 흐름이 좋은 편입니다.", "지금 흐름이 좋은 편이니라."])
        : val.grade === "중"
          ? t(g, ["지금 흐름은 보통이에요.", "지금 흐름은 보통입니다.", "지금 흐름은 보통이니라."])
          : t(g, ["지금은 조심해서 걷는 흐름이에요.", "지금은 조심해서 걷는 흐름입니다.", "지금은 조심해서 걷는 흐름이니라."]);
    case "score": {
      const d = val.grade === "상" ? "좋은" : val.grade === "중" ? "무난한" : "조심할";
      return t(g, [`${val.score}점이에요. 흐름은 ${d} 편이에요.`, `${val.score}점입니다. 흐름은 ${d} 편입니다.`, `${val.score}점이니라. 흐름은 ${d} 편이다.`]);
    }
    case "profile":
      return t(g, [`${val.structure}에 ${val.strengthLevel}인 사주예요.`, `${val.structure}에 ${val.strengthLevel}인 사주입니다.`, `${val.structure}에 ${val.strengthLevel}인 사주이니라.`]);
    case "cause": {
      const c = val.causes[0]?.label ?? "겹친 흐름";
      return t(g, [`가장 큰 원인은 ‘${c}’ 신호예요.`, `가장 큰 원인은 ‘${c}’ 신호입니다.`, `가장 큰 원인은 ‘${c}’ 신호이니라.`]);
    }
    case "needs-partner":
      return t(g, ["두 사람의 정보가 필요해요.", "두 사람의 정보가 필요합니다.", "두 사람의 정보가 필요하니라."]);
  }
}

const SCOPE_TEXT: Record<string, Tri> = {
  natal: ["타고난 사주에서 나온 근거예요.", "타고난 사주에서 나온 근거입니다.", "타고난 사주에서 나온 근거이니라."],
  year: ["그 해의 흐름에서 나온 근거예요.", "그 해의 흐름에서 나온 근거입니다.", "그 해의 흐름에서 나온 근거이니라."],
  month: ["그 달의 흐름에서 나온 근거예요.", "그 달의 흐름에서 나온 근거입니다.", "그 달의 흐름에서 나온 근거이니라."],
};

const ACTION: Record<string, { do: Tri; avoid: Tri }> = {
  love: {
    do: ["새로운 사람을 만날 자리나 모임을 하나 정해 신청해 보세요.", "새로운 사람을 만날 자리나 모임을 하나 정해 신청해 보시지요.", "새로운 사람을 만날 자리를 하나 정해 신청하여라."],
    avoid: ["급하게 결론을 내리려는 태도는 피하세요.", "급하게 결론을 내리려는 태도는 피하시지요.", "급하게 결론을 내리려는 태도는 피하여라."],
  },
  wealth: {
    do: ["이번 달 수입과 지출을 한 번 정리해 적어 보세요.", "이번 달 수입과 지출을 한 번 정리해 적어 보시지요.", "이번 달 수입과 지출을 한 번 정리해 적어 보아라."],
    avoid: ["충동적인 큰 지출은 피하세요.", "충동적인 큰 지출은 피하시지요.", "충동적인 큰 지출은 피하여라."],
  },
  work: {
    do: ["지금 하는 일의 성과를 한 줄씩 적어 정리해 보세요.", "지금 하는 일의 성과를 한 줄씩 적어 정리해 보시지요.", "지금 하는 일의 성과를 한 줄씩 적어 정리하여라."],
    avoid: ["감정이 앞선 갑작스러운 결정은 피하세요.", "감정이 앞선 갑작스러운 결정은 피하시지요.", "감정이 앞선 갑작스러운 결정은 피하여라."],
  },
  general: {
    do: ["이번 달 꼭 하고 싶은 일 하나만 정해서 끝까지 해 보세요.", "이번 달 꼭 하고 싶은 일 하나만 정해서 끝까지 해 보시지요.", "이번 달 꼭 하고 싶은 일 하나만 정해 끝까지 해 보아라."],
    avoid: ["한꺼번에 여러 가지를 벌이는 일은 피하세요.", "한꺼번에 여러 가지를 벌이는 일은 피하시지요.", "한꺼번에 여러 가지를 벌이는 일은 피하여라."],
  },
};
const actionKind = (code: string) => (code === "L" || code === "M" || code === "C" ? "love" : code === "W" ? "wealth" : code === "J" ? "work" : "general");

const FILLERS: Tri[] = [
  ["사주는 결과를 못 박는 도구가 아니라 흐름을 읽는 지도예요. 같은 시기라도 어떻게 움직이느냐에 따라 체감은 달라져요.", "사주는 결과를 못 박는 도구가 아니라 흐름을 읽는 지도입니다. 같은 시기라도 어떻게 움직이느냐에 따라 체감은 달라지지요.", "사주는 결과를 못 박는 도구가 아니라 흐름을 읽는 지도이니라. 같은 시기라도 어찌 움직이느냐에 따라 체감은 달라지느니라."],
  ["큰 결정은 한 번에 내리기보다 작은 확인을 여러 번 거치면 실수가 줄어요.", "큰 결정은 한 번에 내리기보다 작은 확인을 여러 번 거치면 실수가 줄어듭니다.", "큰 결정은 한 번에 내리기보다 작은 확인을 여러 번 거치면 실수가 줄어드느니라."],
  ["마음이 급해질 때는 계산값에서 가장 먼저 눈에 띄는 근거로 돌아와 보세요.", "마음이 급해질 때는 계산값에서 가장 먼저 눈에 띄는 근거로 돌아가 보시지요.", "마음이 급해질 때는 계산값에서 가장 먼저 눈에 띄는 근거로 돌아가 보아라."],
  ["지금 단계에서는 결과를 서두르기보다 준비한 만큼 천천히 확인해 가는 쪽이 안정적이에요.", "지금 단계에서는 결과를 서두르기보다 준비한 만큼 천천히 확인해 가는 쪽이 안정적입니다.", "지금 단계에서는 결과를 서두르기보다 준비한 만큼 천천히 확인해 가는 쪽이 안정적이니라."],
  ["이 풀이는 참고용 해석이니, 마음에 걸리는 부분은 직접 확인하며 받아들이면 돼요.", "이 풀이는 참고용 해석이니, 마음에 걸리는 부분은 직접 확인하며 받아들이시면 됩니다.", "이 풀이는 참고용 해석이니, 마음에 걸리는 부분은 직접 확인하며 받아들이면 되느니라."],
  ["흐름이 좋은 때에는 욕심을 조금 줄이고, 흐름이 무거운 때에는 속도를 조금 늦추면 균형이 맞아요.", "흐름이 좋은 때에는 욕심을 조금 줄이고, 흐름이 무거운 때에는 속도를 조금 늦추면 균형이 맞습니다.", "흐름이 좋은 때에는 욕심을 조금 줄이고, 흐름이 무거운 때에는 속도를 조금 늦추면 균형이 맞느니라."],
];

function verdictSentence(v: Verdict, g: GuideId): string {
  const val = v.value;
  const when = (a: string, b: string) => t(g, [`${a}에 힘이 가장 몰려 있고, ${b}이 그 뒤를 이어요.`, `${a}에 힘이 가장 몰려 있고, ${b}이 그 뒤를 잇습니다.`, `${a}에 힘이 가장 몰려 있고, ${b}이 그 뒤를 잇느니라.`]);
  switch (val.kind) {
    case "timing-month":
    case "yesno+timing-month": {
      const ms = uniq(val.picks, mm).map(mm);
      return ms.length > 1 ? when(ms[0], ms[1]) : t(g, [`${ms[0]}에 힘이 가장 몰려 있어요.`, `${ms[0]}에 힘이 가장 몰려 있습니다.`, `${ms[0]}에 힘이 가장 몰려 있느니라.`]);
    }
    case "timing-year": {
      const ys = uniq(val.picks, yy).map(yy);
      return ys.length > 1 ? when(ys[0], ys[1]) : t(g, [`${ys[0]}에 힘이 가장 몰려 있어요.`, `${ys[0]}에 힘이 가장 몰려 있습니다.`, `${ys[0]}에 힘이 가장 몰려 있느니라.`]);
    }
    case "best-worst-month":
    case "monthly-graph":
      return t(g, ["좋은 달에는 움직이고, 조심할 달에는 속도를 늦추는 식으로 나눠서 보면 편해요.", "좋은 달에는 움직이고, 조심할 달에는 속도를 늦추는 식으로 나눠서 보시면 편합니다.", "좋은 달에는 움직이고, 조심할 달에는 속도를 늦추는 식으로 나눠서 보면 편하니라."]);
    case "best-worst-year":
      return t(g, ["좋은 해에는 움직이고, 조심할 해에는 준비에 힘쓰는 식으로 나눠서 보면 편해요.", "좋은 해에는 움직이고, 조심할 해에는 준비에 힘쓰는 식으로 나눠서 보시면 편합니다.", "좋은 해에는 움직이고, 조심할 해에는 준비에 힘쓰는 식으로 나눠서 보면 편하니라."]);
    case "yesno":
    case "grade":
    case "score":
      return t(g, ["계산된 흐름의 방향을 기준으로 읽으면 지금 어디에 힘을 둘지 가늠할 수 있어요.", "계산된 흐름의 방향을 기준으로 읽으면 지금 어디에 힘을 둘지 가늠할 수 있습니다.", "계산된 흐름의 방향을 기준으로 읽으면 지금 어디에 힘을 둘지 가늠할 수 있느니라."]);
    default:
      return t(g, ["타고난 사주의 짜임을 먼저 보고, 그 위에 지금의 흐름을 겹쳐서 읽었어요.", "타고난 사주의 짜임을 먼저 보고, 그 위에 지금의 흐름을 겹쳐서 읽었습니다.", "타고난 사주의 짜임을 먼저 보고, 그 위에 지금의 흐름을 겹쳐서 읽었느니라."]);
  }
}

function consultWord(v: Verdict) {
  return v.safety.consult.length ? v.safety.consult.join("·") : "";
}

export function sampleAnswer(args: {
  verdict: Verdict;
  guide: GuideId;
  profile: Profile;
  questionId: string;
  timeUnknown: boolean;
  yearly: boolean;
}): Answer {
  const { verdict: v, guide: g, profile, questionId, timeUnknown, yearly } = args;
  const q = questionRow(questionId);
  const kind = actionKind(q.categoryCode);
  const [lo, hi] = yearly ? [620, 880] : [360, 490];

  const top = [...v.signalsFor].sort((a, b) => b.weight - a.weight).slice(0, 3);
  const evidence = top.slice(0, Math.min(3, Math.max(top.length >= 2 ? 2 : top.length, 2))).map((s) => ({ chip: s.label, why: t(g, SCOPE_TEXT[s.scope]) }));

  const labels = top.map((s) => `‘${s.label}’`).join(", ");
  const kw = profile.keywords[0].word;
  const sentences: string[] = [
    t(g, [`원래 ‘${kw}’ 기질이 있는 분이라, 이 질문도 흐름을 차분히 살펴보면 답이 또렷해져요.`, `원래 ‘${kw}’ 기질을 지닌 분이라, 이 질문도 흐름을 차분히 살피면 답이 분명해집니다.`, `원래 ‘${kw}’ 기질을 타고났으니, 이 질문도 흐름을 차분히 살피면 답이 보이느니라.`]),
  ];
  if (top.length > 0) sentences.push(t(g, [`${labels} 신호가 이 판정을 받쳐 줘요.`, `${labels} 신호가 이 판정을 받쳐 줍니다.`, `${labels} 신호가 이 판정을 받쳐 주느니라.`]));
  sentences.push(verdictSentence(v, g));
  if (v.signalsAgainst.length > 0) sentences.push(t(g, ["반대로 작용하는 신호도 있으니 한꺼번에 서두르지 말고 한 걸음씩 확인해 보세요.", "반대로 작용하는 신호도 있으니 한꺼번에 서두르지 말고 한 걸음씩 확인해 보시지요.", "반대로 작용하는 신호도 있으니 한꺼번에 서두르지 말고 한 걸음씩 확인하여라."]));
  const consult = consultWord(v);
  if (consult) sentences.push(t(g, [`${consult} 관련 판단은 사주만으로 정하지 말고 전문가 상담을 함께 받아 보세요.`, `${consult} 관련 판단은 사주만으로 정하지 마시고 전문가 상담을 함께 받아 보시지요.`, `${consult} 관련 판단은 사주만으로 정하지 말고 전문가 상담을 함께 받아 보아라.`]));

  // 글자 수를 맞추기 위해 일반 조언 문장을 필요한 만큼만 덧붙인다
  const join = (list: string[]) => list.join(" ");
  let fill = 0;
  while (Array.from(join(sentences)).length < lo && fill < FILLERS.length * 2) {
    sentences.push(t(g, FILLERS[fill % FILLERS.length]));
    fill++;
  }
  while (Array.from(join(sentences)).length > hi && sentences.length > 2) sentences.pop();
  const story = join(sentences);

  const val = v.value;
  const firstMonth = "picks" in val && val.kind !== "timing-year" && val.picks.length > 0 && "month" in val.picks[0] ? `${(val.picks[0] as { month: number }).month}월` : null;
  const by = firstMonth ? t(g, [`${firstMonth}이 오기 전까지`, `${firstMonth}이 오기 전까지`, `${firstMonth}이 오기 전까지`]) : t(g, ["이번 달 안에", "이번 달 안에", "이번 달 안에"]);

  const notes: string[] = [];
  if (v.confidence === "약") notes.push(t(g, ["사주만으로 단정하기 어려워요.", "사주만으로 단정하기 어렵습니다.", "사주만으로 단정하기 어려우니라."]));
  if (timeUnknown) notes.push(t(g, ["출생 시간을 몰라 시주 없이 계산해서 확신도를 한 단계 낮췄어요.", "출생 시간을 몰라 시주 없이 계산해서 확신도를 한 단계 낮췄습니다.", "출생 시간을 몰라 시주 없이 계산하였으니 확신도를 한 단계 낮췄느니라."]));

  const counter =
    v.signalsAgainst.length > 0
      ? t(g, [`다만 ‘${v.signalsAgainst[0].label}’ 신호는 반대로 작용해요.`, `다만 ‘${v.signalsAgainst[0].label}’ 신호는 반대로 작용합니다.`, `다만 ‘${v.signalsAgainst[0].label}’ 신호는 반대로 작용하느니라.`])
      : "";

  const actionDo = consult
    ? t(g, ["결정하기 전에 해당 분야 전문가와 상담해 보세요.", "결정하기 전에 해당 분야 전문가와 상담해 보시지요.", "결정하기 전에 해당 분야 전문가와 상담하여라."])
    : t(g, ACTION[kind].do);

  const answer: Answer = {
    headline: sampleHeadline(v, g),
    evidence,
    story,
    counter,
    action: { do: actionDo, by },
    avoid: t(g, ACTION[kind].avoid),
    confidenceNote: notes.join(" "),
  };

  if (yearly && val.kind === "monthly-graph") {
    const bestSet = new Set(val.best.map((m) => m.label));
    const worstSet = new Set(val.worst.map((m) => m.label));
    answer.months = val.months.map((m) => ({
      month: m.label,
      line: bestSet.has(m.label)
        ? t(g, ["적극적으로 움직여 보세요", "적극적으로 움직이시지요", "힘껏 움직이거라"])
        : worstSet.has(m.label)
          ? t(g, ["무리하지 않고 쉬어 가요", "무리하지 않고 쉬어 가시지요", "무리하지 말고 쉬어 가거라"])
          : t(g, ["차분히 이어 가요", "차분히 이어 가시지요", "차분히 이어 가거라"]),
    }));
  }
  void categoryNameOf;
  return answer;
}

