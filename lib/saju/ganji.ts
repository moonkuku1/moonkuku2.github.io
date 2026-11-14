/** 천간·지지와 60갑자. 모든 계산은 이 표를 쓴다. */
export const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
export const STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;
export const BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export type Pillar = {
  /** 0~59 (갑자=0) */
  index: number;
  stem: number; // 0~9
  branch: number; // 0~11
  /** 예: 갑자 */
  name: string;
  /** 예: 甲子 */
  hanja: string;
};

export function pillarFromIndex(index: number): Pillar {
  const i = ((index % 60) + 60) % 60;
  const stem = i % 10;
  const branch = i % 12;
  return {
    index: i,
    stem,
    branch,
    name: `${STEMS[stem]}${BRANCHES[branch]}`,
    hanja: `${STEMS_HANJA[stem]}${BRANCHES_HANJA[branch]}`,
  };
}

/** 천간·지지 번호로 60갑자 번호를 구한다. 짝이 맞지 않으면(예: 갑축) 오류. */
export function indexFromStemBranch(stem: number, branch: number): number {
  for (let i = stem; i < 60; i += 10) if (i % 12 === branch) return i;
  throw new Error(`맞지 않는 간지 짝이에요: ${STEMS[stem]}${BRANCHES[branch]}`);
}

/** "갑자" 또는 "갑자(甲子)" 같은 글자에서 60갑자 번호를 읽는다. */
export function indexFromName(text: string): number {
  const stem = STEMS.indexOf(text[0] as (typeof STEMS)[number]);
  const branch = BRANCHES.indexOf(text[1] as (typeof BRANCHES)[number]);
  if (stem < 0 || branch < 0) throw new Error(`간지를 읽을 수 없어요: ${text}`);
  return indexFromStemBranch(stem, branch);
}
