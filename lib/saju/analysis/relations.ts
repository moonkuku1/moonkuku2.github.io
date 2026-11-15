import { BRANCHES, STEMS } from "../ganji";
import type { FourPillars } from "../pillars";
import { B, S } from "./tables";

export type RelationKind =
  | "천간합"
  | "천간충"
  | "육합"
  | "삼합"
  | "반합"
  | "방합"
  | "충"
  | "형"
  | "자형"
  | "파"
  | "해"
  | "원진";

export type Relation = {
  kind: RelationKind;
  /** 관계에 든 글자(예: ["자", "오"]) */
  chars: string[];
  /** 글자가 있는 자리(예: ["연지", "일지"]) */
  places: string[];
  /** 서로 붙어 있는 자리인가(연-월, 월-일, 일-시) */
  adjacent: boolean;
  /** 합이 되어 바뀌는 오행(천간합·육합·삼합·방합) */
  element?: string;
  /** 설명용 이름. 예: "인사신 삼형", "해묘미 삼합" */
  label?: string;
};

type Slot = { value: number; place: string; order: number };

const stemPairs = (a: string, b: string, el: string) => ({ a: S(a), b: S(b), el });
// 천간합: 갑기 토, 을경 금, 병신 수, 정임 목, 무계 화
const STEM_COMBINE = [stemPairs("갑", "기", "토"), stemPairs("을", "경", "금"), stemPairs("병", "신", "수"), stemPairs("정", "임", "목"), stemPairs("무", "계", "화")];
// 천간충: 갑경, 을신, 병임, 정계 (무기는 충이 없다)
const STEM_CLASH: [number, number][] = [[S("갑"), S("경")], [S("을"), S("신")], [S("병"), S("임")], [S("정"), S("계")]];

const pair = (a: string, b: string): [number, number] => [B(a), B(b)];
// 육합: 자축 토, 인해 목, 묘술 화, 진유 금, 사신 수, 오미(화/토)
const SIX_COMBINE: { p: [number, number]; el: string }[] = [
  { p: pair("자", "축"), el: "토" },
  { p: pair("인", "해"), el: "목" },
  { p: pair("묘", "술"), el: "화" },
  { p: pair("진", "유"), el: "금" },
  { p: pair("사", "신"), el: "수" },
  { p: pair("오", "미"), el: "화·토" },
];
// 충: 자오 축미 인신 묘유 진술 사해
const CLASH = [pair("자", "오"), pair("축", "미"), pair("인", "신"), pair("묘", "유"), pair("진", "술"), pair("사", "해")];
// 파: 자유 축진 인해 묘오 사신 미술
const BREAK = [pair("자", "유"), pair("축", "진"), pair("인", "해"), pair("묘", "오"), pair("사", "신"), pair("미", "술")];
// 해: 자미 축오 인사 묘진 신해 유술
const HARM = [pair("자", "미"), pair("축", "오"), pair("인", "사"), pair("묘", "진"), pair("신", "해"), pair("유", "술")];
// 원진: 자미 축오 인유 묘신 진해 사술
const WONJIN = [pair("자", "미"), pair("축", "오"), pair("인", "유"), pair("묘", "신"), pair("진", "해"), pair("사", "술")];
// 형: 인사신(무은지형), 축술미(지세지형), 자묘(무례지형), 자형(진진·오오·유유·해해)
const PUNISH_GROUPS: { chars: number[]; label: string }[] = [
  { chars: [B("인"), B("사"), B("신")], label: "인사신 무은지형" },
  { chars: [B("축"), B("술"), B("미")], label: "축술미 지세지형" },
  { chars: [B("자"), B("묘")], label: "자묘 무례지형" },
];
const SELF_PUNISH = [B("진"), B("오"), B("유"), B("해")];
// 삼합: 신자진 수, 해묘미 목, 인오술 화, 사유축 금 (가운데 글자가 왕지)
const TRIPLE: { chars: [number, number, number]; el: string }[] = [
  { chars: [B("신"), B("자"), B("진")], el: "수" },
  { chars: [B("해"), B("묘"), B("미")], el: "목" },
  { chars: [B("인"), B("오"), B("술")], el: "화" },
  { chars: [B("사"), B("유"), B("축")], el: "금" },
];
// 방합: 인묘진 목, 사오미 화, 신유술 금, 해자축 수
const DIRECTIONAL: { chars: [number, number, number]; el: string }[] = [
  { chars: [B("인"), B("묘"), B("진")], el: "목" },
  { chars: [B("사"), B("오"), B("미")], el: "화" },
  { chars: [B("신"), B("유"), B("술")], el: "금" },
  { chars: [B("해"), B("자"), B("축")], el: "수" },
];

const isAdjacent = (a: Slot, b: Slot) => Math.abs(a.order - b.order) === 1;
const samePair = (p: [number, number], x: number, y: number) => (p[0] === x && p[1] === y) || (p[0] === y && p[1] === x);

/** 사주 안의 합·충·형·파·해·원진을 모두 찾는다(요구사항 1.7). 시주가 없으면 3개 기둥만 본다. */
export function analyzeRelations(p: FourPillars): Relation[] {
  const pillars = [p.year, p.month, p.day, ...(p.hour ? [p.hour] : [])];
  const stemNames = ["연간", "월간", "일간", "시간"];
  const branchNames = ["연지", "월지", "일지", "시지"];
  const stems: Slot[] = pillars.map((x, i) => ({ value: x.stem, place: stemNames[i], order: i }));
  const branches: Slot[] = pillars.map((x, i) => ({ value: x.branch, place: branchNames[i], order: i }));
  const out: Relation[] = [];

  // 두 글자 관계
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const a = stems[i];
      const b = stems[j];
      const combine = STEM_COMBINE.find((c) => (c.a === a.value && c.b === b.value) || (c.a === b.value && c.b === a.value));
      if (combine) out.push({ kind: "천간합", chars: [STEMS[a.value], STEMS[b.value]], places: [a.place, b.place], adjacent: isAdjacent(a, b), element: combine.el });
      if (STEM_CLASH.some(([x, y]) => (x === a.value && y === b.value) || (x === b.value && y === a.value))) {
        out.push({ kind: "천간충", chars: [STEMS[a.value], STEMS[b.value]], places: [a.place, b.place], adjacent: isAdjacent(a, b) });
      }
    }
  }
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i];
      const b = branches[j];
      const base = { chars: [BRANCHES[a.value], BRANCHES[b.value]], places: [a.place, b.place], adjacent: isAdjacent(a, b) };
      const six = SIX_COMBINE.find((c) => samePair(c.p, a.value, b.value));
      if (six) out.push({ kind: "육합", ...base, element: six.el });
      if (CLASH.some((c) => samePair(c, a.value, b.value))) out.push({ kind: "충", ...base });
      if (BREAK.some((c) => samePair(c, a.value, b.value))) out.push({ kind: "파", ...base });
      if (HARM.some((c) => samePair(c, a.value, b.value))) out.push({ kind: "해", ...base });
      if (WONJIN.some((c) => samePair(c, a.value, b.value))) out.push({ kind: "원진", ...base });
      // 형: 같은 묶음 안의 서로 다른 두 글자
      for (const g of PUNISH_GROUPS) {
        if (a.value !== b.value && g.chars.includes(a.value) && g.chars.includes(b.value)) out.push({ kind: "형", ...base, label: g.label });
      }
      if (a.value === b.value && SELF_PUNISH.includes(a.value)) out.push({ kind: "자형", ...base, label: `${BRANCHES[a.value]}${BRANCHES[a.value]} 자형` });
    }
  }

  // 세 글자: 삼합(왕지가 들어간 두 글자는 반합), 방합
  const present = (v: number) => branches.filter((x) => x.value === v);
  for (const t of TRIPLE) {
    const found = t.chars.map((c) => present(c));
    const all = found.every((f) => f.length > 0);
    const label = t.chars.map((c) => BRANCHES[c]).join("");
    if (all) {
      const slots = found.map((f) => f[0]);
      out.push({ kind: "삼합", chars: t.chars.map((c) => BRANCHES[c]), places: slots.map((s) => s.place), adjacent: slots.every((s, i) => i === 0 || isAdjacent(slots[i - 1], s)), element: t.el, label: `${label} 삼합` });
    } else {
      // 왕지(가운데 글자)가 있고 생지 또는 고지 중 하나가 있으면 반합
      const mid = found[1];
      if (mid.length > 0) {
        for (const side of [0, 2]) {
          if (found[side].length > 0) {
            const a = found[side][0];
            const b = mid[0];
            out.push({ kind: "반합", chars: [BRANCHES[t.chars[side]], BRANCHES[t.chars[1]]], places: [a.place, b.place], adjacent: isAdjacent(a, b), element: t.el, label: `${label} 반합` });
          }
        }
      }
    }
  }
  for (const d of DIRECTIONAL) {
    const found = d.chars.map((c) => present(c));
    if (found.every((f) => f.length > 0)) {
      const slots = found.map((f) => f[0]);
      out.push({ kind: "방합", chars: d.chars.map((c) => BRANCHES[c]), places: slots.map((s) => s.place), adjacent: slots.every((s, i) => i === 0 || isAdjacent(slots[i - 1], s)), element: d.el, label: `${d.chars.map((c) => BRANCHES[c]).join("")} 방합` });
    }
  }

  // 삼형: 세 글자가 모두 모이면 한 줄로 알린다(두 글자씩의 형은 위에 이미 있다)
  for (const g of PUNISH_GROUPS.filter((x) => x.chars.length === 3)) {
    const found = g.chars.map((c) => present(c));
    if (found.every((f) => f.length > 0)) {
      const slots = found.map((f) => f[0]);
      out.push({ kind: "형", chars: g.chars.map((c) => BRANCHES[c]), places: slots.map((s) => s.place), adjacent: false, label: `${g.label} (삼형 완성)` });
    }
  }

  return out;
}

