import {
  GROUPS,
  elementOfBranch,
  elementOfStem,
  groupOfBranch,
  groupOfStem,
  isClash,
  isCombine,
  type Group,
  type SignalContext,
} from "./context";

/**
 * 공통 신호 라이브러리 (요구사항 2.1).
 * 신호 하나 = 순수 함수 하나. 같은 입력이면 항상 같은 값이고, 질문 레시피가 이 신호들을 조합한다.
 * `plain`은 결과 화면의 근거 칩을 눌렀을 때 보여 줄 쉬운 설명이다(AI가 문장을 쓸 때도 참고한다).
 * 가중치는 레시피에 있고, 신호의 해석은 명리 전문가 검수를 받는다.
 */
export type SignalScope = "natal" | "year" | "month";

export type SignalDef = {
  key: string;
  label: string;
  scope: SignalScope;
  plain: string;
  test: (ctx: SignalContext) => boolean;
};

const defs: SignalDef[] = [];
const add = (d: SignalDef) => {
  if (defs.some((x) => x.key === d.key)) throw new Error(`신호 키가 겹쳐요: ${d.key}`);
  defs.push(d);
};

const GROUP_PLAIN: Record<Group, string> = {
  비겁: "나와 같은 기운(친구·동료·경쟁자)",
  식상: "내가 표현하고 만들어 내는 기운(재능·말·결과물)",
  재성: "재물과 성과, 현실적인 결과의 기운",
  관성: "책임·규칙·직장과 사회적 평가의 기운",
  인성: "배움·도움·보호와 안정의 기운",
};
const GROUP_KEY: Record<Group, string> = { 비겁: "Peer", 식상: "Food", 재성: "Wealth", 관성: "Officer", 인성: "Print" };

// ───────── 원국(타고난 사주) ─────────
for (const g of GROUPS) {
  add({ key: `natal${GROUP_KEY[g]}Strong`, label: `원국에 ${g} 강함`, scope: "natal", plain: `사주에 ${GROUP_PLAIN[g]}가 많아 힘이 실려 있어요.`, test: (c) => c.d.counts[g] >= 3 });
  if (g === "재성" || g === "관성") add({ key: `natal${GROUP_KEY[g]}Absent`, label: `원국에 ${g} 없음`, scope: "natal", plain: `사주에 ${GROUP_PLAIN[g]}가 드러나 있지 않아요.`, test: (c) => c.d.counts[g] === 0 });
}
add({ key: "natalSpousePresent", label: "배우자성 있음", scope: "natal", plain: "사주에 배우자를 뜻하는 기운이 자리 잡고 있어요.", test: (c) => c.d.counts[c.d.spouseGroup] >= 1 });
add({ key: "natalSpouseStrong", label: "배우자성 뚜렷함", scope: "natal", plain: "배우자를 뜻하는 기운이 여러 곳에 있어 인연의 존재감이 커요.", test: (c) => c.d.counts[c.d.spouseGroup] >= 2 });
add({ key: "natalSpouseAbsent", label: "배우자성 없음", scope: "natal", plain: "사주 원국에는 배우자를 뜻하는 기운이 드러나 있지 않아, 운에서 들어올 때 더 크게 작용해요.", test: (c) => c.d.counts[c.d.spouseGroup] === 0 });
add({
  key: "natalDayBranchClashed",
  label: "일지가 충을 받음",
  scope: "natal",
  plain: "태어난 날의 자리(배우자궁)가 사주 안의 다른 글자와 부딪혀 관계가 흔들리기 쉬워요.",
  test: (c) => c.chart.relations.some((r) => r.kind === "충" && r.places.includes("일지")),
});
add({
  key: "natalDayBranchCombined",
  label: "일지가 합을 이룸",
  scope: "natal",
  plain: "태어난 날의 자리(배우자궁)가 사주 안의 다른 글자와 잘 어울려 관계가 안정되기 쉬워요.",
  test: (c) => c.chart.relations.some((r) => (r.kind === "육합" || r.kind === "삼합" || r.kind === "반합") && r.places.includes("일지")),
});
add({ key: "natalClashPresent", label: "원국에 충 있음", scope: "natal", plain: "사주 안에 서로 부딪히는 글자가 있어 변화와 이동이 잦은 편이에요.", test: (c) => c.chart.relations.some((r) => r.kind === "충") });
add({ key: "natalPunishPresent", label: "원국에 형 있음", scope: "natal", plain: "사주 안에 서로 긴장을 만드는 글자(형)가 있어 마음고생이나 시험을 겪기 쉬워요.", test: (c) => c.chart.relations.some((r) => r.kind === "형" || r.kind === "자형") });
add({ key: "natalStrengthStrong", label: "일간이 강함", scope: "natal", plain: "나를 돕는 기운이 많아 주도적으로 밀고 나가는 힘이 강해요.", test: (c) => c.chart.strength.level === "신강" || c.chart.strength.level === "극신강" });
add({ key: "natalStrengthWeak", label: "일간이 약함", scope: "natal", plain: "나를 돕는 기운이 적어 주변의 도움과 안정이 중요해요.", test: (c) => c.chart.strength.level === "신약" || c.chart.strength.level === "극신약" });
add({ key: "natalMonthSupport", label: "월령을 얻음", scope: "natal", plain: "태어난 달의 기운이 나를 도와 기본 체력이 든든해요.", test: (c) => c.chart.strength.deukryeong });
const hasSinsal = (c: SignalContext, name: string) => c.chart.sinsal.hits.some((h) => h.name === name);
add({ key: "natalDohwa", label: "도화 있음", scope: "natal", plain: "사람을 끄는 매력과 인기의 기운(도화)이 사주에 있어요.", test: (c) => hasSinsal(c, "도화") });
add({ key: "natalYeokma", label: "역마 있음", scope: "natal", plain: "움직이고 옮겨 다니는 기운(역마)이 있어 이동·변화에 열려 있어요.", test: (c) => hasSinsal(c, "역마") });
add({ key: "natalCheoneul", label: "천을귀인 있음", scope: "natal", plain: "어려울 때 도와주는 사람(귀인)의 기운이 사주에 있어요.", test: (c) => hasSinsal(c, "천을귀인") });
add({ key: "natalMunchang", label: "문창귀인 있음", scope: "natal", plain: "글·공부·시험에 유리한 기운(문창)이 있어요.", test: (c) => hasSinsal(c, "문창귀인") });
add({
  key: "natalHelpfulPresent",
  label: "도움이 되는 오행이 원국에 있음",
  scope: "natal",
  plain: "나에게 도움이 되는 오행이 사주에 이미 자리 잡고 있어 운이 들어올 때 힘을 받기 쉬워요.",
  test: (c) => c.chart.elements.characters.some((ch) => c.d.helpful.has(ch.stem.element) || c.d.helpful.has(ch.branch.element)),
});

// ───────── 세운(그 해) ─────────
const stemGroupOfYear = (c: SignalContext) => groupOfStem(c.d.dayStem, c.d.yearPillar.stem);
const branchGroupOfYear = (c: SignalContext) => groupOfBranch(c.d.dayStem, c.d.yearPillar.branch);
for (const g of GROUPS) {
  add({
    key: `year${GROUP_KEY[g]}`,
    label: `세운에 ${g}`,
    scope: "year",
    plain: `그 해에 ${GROUP_PLAIN[g]}가 들어와요.`,
    test: (c) => stemGroupOfYear(c) === g || branchGroupOfYear(c) === g,
  });
}
add({ key: "yearSpouseStar", label: "세운에 배우자성", scope: "year", plain: "그 해에 배우자를 뜻하는 기운이 들어와 인연이 움직이기 쉬워요.", test: (c) => stemGroupOfYear(c) === c.d.spouseGroup || branchGroupOfYear(c) === c.d.spouseGroup });
add({ key: "yearBranchCombinesDay", label: "세운이 일지와 합", scope: "year", plain: "그 해의 지지가 태어난 날의 자리와 합을 이뤄 관계와 일이 순하게 풀려요.", test: (c) => isCombine(c.d.yearPillar.branch, c.d.dayBranch) });
add({ key: "yearBranchClashesDay", label: "세운이 일지를 충", scope: "year", plain: "그 해의 지지가 태어난 날의 자리와 부딪혀 관계·거처에 변화가 생기기 쉬워요.", test: (c) => isClash(c.d.yearPillar.branch, c.d.dayBranch) });
add({ key: "yearBranchClashesMonth", label: "세운이 월지를 충", scope: "year", plain: "그 해의 지지가 태어난 달의 자리(직업·사회궁)와 부딪혀 일과 환경에 변동이 생기기 쉬워요.", test: (c) => isClash(c.d.yearPillar.branch, c.d.monthBranch) });
add({ key: "yearBranchClashesYear", label: "세운이 연지를 충", scope: "year", plain: "그 해의 지지가 태어난 해의 자리(뿌리·가족)와 부딪혀 집안이나 오랜 관계에 변화가 생기기 쉬워요.", test: (c) => isClash(c.d.yearPillar.branch, c.d.yearBranch) });
add({ key: "yearHelpfulElement", label: "세운이 도움이 되는 오행", scope: "year", plain: "그 해의 기운이 나에게 도움이 되는 오행이라 힘을 받는 해예요.", test: (c) => c.d.helpful.has(elementOfStem(c.d.yearPillar.stem)) || c.d.helpful.has(elementOfBranch(c.d.yearPillar.branch)) });
add({ key: "yearAvoidElement", label: "세운이 조심할 오행", scope: "year", plain: "그 해의 기운이 나에게 부담이 되는 오행이라 무리하지 않는 게 좋은 해예요.", test: (c) => c.d.avoid.has(elementOfStem(c.d.yearPillar.stem)) || c.d.avoid.has(elementOfBranch(c.d.yearPillar.branch)) });
add({ key: "yearDohwa", label: "세운이 도화", scope: "year", plain: "그 해에 사람을 끄는 매력(도화)이 활발해져요.", test: (c) => c.d.dohwa.has(c.d.yearPillar.branch) });
add({ key: "yearYeokma", label: "세운이 역마", scope: "year", plain: "그 해에 이동·이직·여행 같은 움직임(역마)이 활발해져요.", test: (c) => c.d.yeokma.has(c.d.yearPillar.branch) });
add({ key: "yearCheoneul", label: "세운이 천을귀인", scope: "year", plain: "그 해에 도와주는 사람(귀인)을 만나기 쉬워요.", test: (c) => c.d.cheoneul.has(c.d.yearPillar.branch) });
add({ key: "yearMunchang", label: "세운이 문창", scope: "year", plain: "그 해에 글·공부·시험 운이 따라 줘요.", test: (c) => c.d.munchang === c.d.yearPillar.branch });
add({ key: "yearSamjae", label: "삼재 해", scope: "year", plain: "삼재(세 해 동안 조심하는 흐름)에 든 해라 큰 결정은 신중히 하는 게 좋아요.", test: (c) => c.d.samjaeActive });

// ───────── 대운(10년 흐름) ─────────
const periodGroup = (c: SignalContext): Group[] => (c.d.period ? [groupOfStem(c.d.dayStem, c.d.period.pillar.stem), groupOfBranch(c.d.dayStem, c.d.period.pillar.branch)] : []);
add({ key: "luckHelpfulElement", label: "대운이 도움이 되는 오행", scope: "year", plain: "지금 10년 흐름(대운)이 나에게 도움이 되는 오행이라 바탕이 든든해요.", test: (c) => !!c.d.period && (c.d.helpful.has(elementOfStem(c.d.period.pillar.stem)) || c.d.helpful.has(elementOfBranch(c.d.period.pillar.branch))) });
add({ key: "luckAvoidElement", label: "대운이 조심할 오행", scope: "year", plain: "지금 10년 흐름(대운)이 나에게 부담이 되는 오행이라 서두르지 않는 게 좋아요.", test: (c) => !!c.d.period && (c.d.avoid.has(elementOfStem(c.d.period.pillar.stem)) || c.d.avoid.has(elementOfBranch(c.d.period.pillar.branch))) });
for (const g of ["재성", "관성", "인성", "식상"] as Group[]) {
  add({ key: `luck${GROUP_KEY[g]}`, label: `대운에 ${g}`, scope: "year", plain: `지금 10년 흐름에 ${GROUP_PLAIN[g]}가 들어와 있어요.`, test: (c) => periodGroup(c).includes(g) });
}
add({ key: "luckSpouseStar", label: "대운에 배우자성", scope: "year", plain: "지금 10년 흐름에 배우자를 뜻하는 기운이 들어와 있어요.", test: (c) => periodGroup(c).includes(c.d.spouseGroup) });

// ───────── 월운(그 달) ─────────
const monthStemGroup = (c: SignalContext) => (c.d.monthPillar ? groupOfStem(c.d.dayStem, c.d.monthPillar.stem) : null);
const monthBranchGroup = (c: SignalContext) => (c.d.monthPillar ? groupOfBranch(c.d.dayStem, c.d.monthPillar.branch) : null);
for (const g of GROUPS) {
  add({ key: `month${GROUP_KEY[g]}`, label: `월운에 ${g}`, scope: "month", plain: `그 달에 ${GROUP_PLAIN[g]}가 들어와요.`, test: (c) => monthStemGroup(c) === g || monthBranchGroup(c) === g });
}
add({ key: "monthSpouseStar", label: "월운에 배우자성", scope: "month", plain: "그 달에 배우자를 뜻하는 기운이 들어와 만남이 생기기 쉬워요.", test: (c) => monthStemGroup(c) === c.d.spouseGroup || monthBranchGroup(c) === c.d.spouseGroup });
add({ key: "monthBranchCombinesDay", label: "월운이 일지와 합", scope: "month", plain: "그 달의 지지가 태어난 날의 자리와 합을 이뤄 관계와 일이 순하게 풀려요.", test: (c) => !!c.d.monthPillar && isCombine(c.d.monthPillar.branch, c.d.dayBranch) });
add({ key: "monthBranchClashesDay", label: "월운이 일지를 충", scope: "month", plain: "그 달의 지지가 태어난 날의 자리와 부딪혀 마음과 관계가 흔들리기 쉬워요.", test: (c) => !!c.d.monthPillar && isClash(c.d.monthPillar.branch, c.d.dayBranch) });
add({ key: "monthHelpfulElement", label: "월운이 도움이 되는 오행", scope: "month", plain: "그 달의 기운이 나에게 도움이 되는 오행이라 힘을 받는 달이에요.", test: (c) => !!c.d.monthPillar && (c.d.helpful.has(elementOfStem(c.d.monthPillar.stem)) || c.d.helpful.has(elementOfBranch(c.d.monthPillar.branch))) });
add({ key: "monthAvoidElement", label: "월운이 조심할 오행", scope: "month", plain: "그 달의 기운이 나에게 부담이 되는 오행이라 무리하지 않는 게 좋은 달이에요.", test: (c) => !!c.d.monthPillar && (c.d.avoid.has(elementOfStem(c.d.monthPillar.stem)) || c.d.avoid.has(elementOfBranch(c.d.monthPillar.branch))) });
add({ key: "monthDohwa", label: "월운이 도화", scope: "month", plain: "그 달에 사람을 끄는 매력(도화)이 활발해져요.", test: (c) => !!c.d.monthPillar && c.d.dohwa.has(c.d.monthPillar.branch) });
add({ key: "monthYeokma", label: "월운이 역마", scope: "month", plain: "그 달에 이동·이직·여행 같은 움직임(역마)이 활발해져요.", test: (c) => !!c.d.monthPillar && c.d.yeokma.has(c.d.monthPillar.branch) });
add({ key: "monthCheoneul", label: "월운이 천을귀인", scope: "month", plain: "그 달에 도와주는 사람(귀인)을 만나기 쉬워요.", test: (c) => !!c.d.monthPillar && c.d.cheoneul.has(c.d.monthPillar.branch) });
add({ key: "monthMunchang", label: "월운이 문창", scope: "month", plain: "그 달에 글·공부·시험 운이 따라 줘요.", test: (c) => !!c.d.monthPillar && c.d.munchang === c.d.monthPillar.branch });

export const SIGNALS: SignalDef[] = defs;
export const SIGNAL_BY_KEY: Map<string, SignalDef> = new Map(defs.map((d) => [d.key, d]));
