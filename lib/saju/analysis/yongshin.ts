import type { FourPillars } from "../pillars";
import type { ElementsAnalysis } from "./elements";
import type { StrengthAnalysis } from "./strength";
import { ELEMENT_NAMES, STEM_ELEMENT, type Element } from "./tables";

/**
 * 도움이 되는 오행 (용신, 방식 A: 억부 + 조후 단순형, docs/saju-decisions.md 2-3).
 * 화면에서는 "용신"이라고 단정하지 않고 "도움이 되는 오행 / 조심할 오행"으로 보여 준다.
 *
 * 1) 억부: 신강·극신강이면 식상·재성·관성(힘을 빼 주는 쪽), 신약·극신약이면 인성·비겁(힘을 보태는 쪽).
 *    각 쪽 안에서는 사주에 가장 적은 것부터 우선한다(같으면 식상→재성→관성, 인성→비겁 순).
 *    중화이면 억부는 쓰지 않고, 사주에서 가장 적은 오행을 도움이 되는 오행으로 본다.
 * 2) 조후: 월지가 한겨울(해·자·축)이면 화, 한여름(사·오·미)이면 수를 더한다.
 */
export type YongshinGroup = "비겁" | "인성" | "식상" | "재성" | "관성";

export type YongshinItem = {
  element: (typeof ELEMENT_NAMES)[number];
  /** 어디서 나온 판단인지 */
  reason: string;
};

export type YongshinAnalysis = {
  method: "억부+조후 단순형";
  /** 도움이 되는 오행(우선순위 순) */
  helpful: YongshinItem[];
  /** 조심할 오행 */
  avoid: YongshinItem[];
  /** 조후가 필요한 계절이면 그 오행, 아니면 null */
  johu: { element: (typeof ELEMENT_NAMES)[number]; season: "한겨울" | "한여름" } | null;
};

/** 일간 오행 d 기준으로 각 십성 무리가 어떤 오행인지 */
export function groupElements(d: Element): Record<YongshinGroup, Element> {
  return {
    비겁: d,
    인성: ((d + 4) % 5) as Element, // 나를 생하는 오행
    식상: ((d + 1) % 5) as Element, // 내가 생하는 오행
    재성: ((d + 2) % 5) as Element, // 내가 극하는 오행
    관성: ((d + 3) % 5) as Element, // 나를 극하는 오행
  };
}

const NAME = (e: Element) => ELEMENT_NAMES[e];
const WINTER = [11, 0, 1]; // 해 자 축
const SUMMER = [5, 6, 7]; // 사 오 미

export function analyzeYongshin(p: FourPillars, elements: ElementsAnalysis, strength: StrengthAnalysis): YongshinAnalysis {
  const d = STEM_ELEMENT[p.day.stem] as Element;
  const g = groupElements(d);
  const count = (e: Element) => elements.withHidden[NAME(e)];

  const helpful: YongshinItem[] = [];
  const avoid: YongshinItem[] = [];
  const addHelpful = (e: Element, reason: string) => {
    if (!helpful.some((x) => x.element === NAME(e))) helpful.push({ element: NAME(e), reason });
  };
  const addAvoid = (e: Element, reason: string) => {
    if (!avoid.some((x) => x.element === NAME(e))) avoid.push({ element: NAME(e), reason });
  };

  const pickOrder = (groups: YongshinGroup[]) => [...groups].sort((a, b) => count(g[a]) - count(g[b]) || groups.indexOf(a) - groups.indexOf(b));

  const level = strength.level;
  if (level === "신강" || level === "극신강") {
    for (const grp of pickOrder(["식상", "재성", "관성"])) addHelpful(g[grp], `일간이 ${level}이라 힘을 덜어 주는 ${grp}`);
    for (const grp of ["비겁", "인성"] as const) addAvoid(g[grp], `일간이 ${level}이라 힘을 더하는 ${grp}`);
  } else if (level === "신약" || level === "극신약") {
    for (const grp of pickOrder(["인성", "비겁"])) addHelpful(g[grp], `일간이 ${level}이라 힘을 보태는 ${grp}`);
    for (const grp of ["식상", "재성", "관성"] as const) addAvoid(g[grp], `일간이 ${level}이라 힘을 빼는 ${grp}`);
  } else {
    const order = ([0, 1, 2, 3, 4] as Element[]).sort((a, b) => count(a) - count(b) || a - b);
    addHelpful(order[0], "균형이 맞아(중화) 가장 적은 오행을 채움");
    addAvoid(order[4], "균형이 맞아(중화) 가장 많은 오행은 더하지 않음");
  }

  // 조후(계절 보정)
  let johu: YongshinAnalysis["johu"] = null;
  if (WINTER.includes(p.month.branch)) johu = { element: "화", season: "한겨울" };
  else if (SUMMER.includes(p.month.branch)) johu = { element: "수", season: "한여름" };
  if (johu) {
    addHelpful(ELEMENT_NAMES.indexOf(johu.element) as Element, `${johu.season}에 태어나 ${johu.element === "화" ? "따뜻하게" : "식혀"} 주는 조후`);
    // 조후로 필요한 오행은 조심할 오행에서 뺀다(서로 어긋나면 조후를 따른다)
    const i = avoid.findIndex((x) => x.element === johu!.element);
    if (i >= 0) avoid.splice(i, 1);
  }

  return { method: "억부+조후 단순형", helpful, avoid, johu };
}
