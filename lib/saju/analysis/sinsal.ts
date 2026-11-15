import { BRANCHES, STEMS, pillarFromIndex } from "../ganji";
import type { FourPillars } from "../pillars";
import { B } from "./tables";

/**
 * 신살 (요구사항 1.7): 도화·홍염·화개·역마·천을귀인·문창귀인·백호·괴강·귀문관·삼재, 12신살.
 * 표는 널리 쓰는 기본형이다. 유파에 따라 다른 표를 쓰는 곳이 있어(예: 괴강에 무술을 넣는지) 명리 전문가 검수가 필요하다.
 */

/** 삼합 그룹 번호: 신자진(0, 수), 해묘미(1, 목), 인오술(2, 화), 사유축(3, 금) */
const GROUP_OF = new Map<number, number>();
[
  ["신", "자", "진"],
  ["해", "묘", "미"],
  ["인", "오", "술"],
  ["사", "유", "축"],
].forEach((g, i) => g.forEach((c) => GROUP_OF.set(B(c), i)));
/** 각 삼합 그룹의 생지(첫 글자): 신, 해, 인, 사 */
const GROUP_START = [B("신"), B("해"), B("인"), B("사")];

export const TWELVE_NAMES = ["지살", "연살", "월살", "망신", "장성", "반안", "역마", "육해", "화개", "겁살", "재살", "천살"] as const;
export type TwelveName = (typeof TWELVE_NAMES)[number];

/** 12신살: 기준 지지의 삼합 생지에서 시작해 지살·연살(도화)·월살·망신·장성·반안·역마·육해·화개·겁살·재살·천살 순으로 한 칸씩 간다. */
export function twelveSinsal(baseBranch: number): Record<TwelveName, number> {
  const start = GROUP_START[GROUP_OF.get(baseBranch)!];
  const out = {} as Record<TwelveName, number>;
  TWELVE_NAMES.forEach((n, i) => (out[n] = (start + i) % 12));
  return out;
}

/** 어떤 지지가 기준 지지에 대해 어느 12신살인지 */
export function twelveSinsalOf(baseBranch: number, target: number): TwelveName {
  const t = twelveSinsal(baseBranch);
  return TWELVE_NAMES.find((n) => t[n] === target)!;
}

const br = (names: string) => names.split("").map((c) => B(c));

// 천을귀인(일간 기준): 갑무경 축미, 을기 자신, 병정 해유, 신 인오, 임계 사묘
const CHEONEUL: Record<string, number[]> = { 갑: br("축미"), 무: br("축미"), 경: br("축미"), 을: br("자신"), 기: br("자신"), 병: br("해유"), 정: br("해유"), 신: br("인오"), 임: br("사묘"), 계: br("사묘") };
// 문창귀인(일간 기준): 갑 사, 을 오, 병 신, 정 유, 무 신, 기 유, 경 해, 신 자, 임 인, 계 묘
const MUNCHANG: Record<string, number> = { 갑: B("사"), 을: B("오"), 병: B("신"), 정: B("유"), 무: B("신"), 기: B("유"), 경: B("해"), 신: B("자"), 임: B("인"), 계: B("묘") };
// 홍염살(일간 기준): 갑 오, 을 오, 병 인, 정 미, 무 진, 기 진, 경 술, 신 유, 임 자, 계 신
const HONGYEOM: Record<string, number> = { 갑: B("오"), 을: B("오"), 병: B("인"), 정: B("미"), 무: B("진"), 기: B("진"), 경: B("술"), 신: B("유"), 임: B("자"), 계: B("신") };
// 백호대살(기둥): 갑진 을미 병술 정축 무진 임술 계축
const BAEKHO = new Set(["갑진", "을미", "병술", "정축", "무진", "임술", "계축"]);
// 괴강살(기둥): 경진 경술 임진 무술
const GOEGANG = new Set(["경진", "경술", "임진", "무술"]);
// 귀문관살(지지 짝): 자유 축오 인미 묘신 진해 사술
const GWIMUN: [number, number][] = [[B("자"), B("유")], [B("축"), B("오")], [B("인"), B("미")], [B("묘"), B("신")], [B("진"), B("해")], [B("사"), B("술")]];

export type SinsalHit = {
  name: string;
  /** 무엇을 기준으로 찾았는지(예: 일간, 연지, 일지) */
  basis: string;
  /** 어느 자리에서 발견됐는지(예: 월지) */
  places: string[];
  /** 해당 글자·간지 */
  chars: string;
};

export type SinsalAnalysis = {
  hits: SinsalHit[];
  /** 연지 기준·일지 기준 12신살을 사주 각 지지에 붙인 값 */
  twelve: { basis: "연지" | "일지"; byPlace: Record<string, TwelveName> }[];
};

/** 사주 안에 있는 신살을 모두 찾는다. 시주가 없으면 시지·시간 자리는 건너뛴다. */
export function analyzeSinsal(p: FourPillars): SinsalAnalysis {
  const cols = [
    { label: "연", pillar: p.year },
    { label: "월", pillar: p.month },
    { label: "일", pillar: p.day },
    ...(p.hour ? [{ label: "시", pillar: p.hour }] : []),
  ];
  const dayStemName = STEMS[p.day.stem];
  const hits: SinsalHit[] = [];
  const branchPlaces = (target: number) => cols.filter((c) => c.pillar.branch === target).map((c) => `${c.label}지`);

  // 12신살로 정해지는 도화(연살)·역마·화개: 연지·일지 두 기준 모두 본다
  const bases: { basis: "연지" | "일지"; branch: number }[] = [
    { basis: "연지", branch: p.year.branch },
    { basis: "일지", branch: p.day.branch },
  ];
  for (const b of bases) {
    const t = twelveSinsal(b.branch);
    for (const [name, key] of [["도화", "연살"], ["역마", "역마"], ["화개", "화개"]] as const) {
      const target = t[key as TwelveName];
      const places = branchPlaces(target).filter((pl) => !(b.basis === "연지" && pl === "연지") && !(b.basis === "일지" && pl === "일지"));
      if (places.length) hits.push({ name, basis: b.basis, places, chars: BRANCHES[target] });
    }
  }

  // 일간 기준
  for (const t of CHEONEUL[dayStemName]) {
    const places = branchPlaces(t);
    if (places.length) hits.push({ name: "천을귀인", basis: "일간", places, chars: BRANCHES[t] });
  }
  const mc = MUNCHANG[dayStemName];
  if (branchPlaces(mc).length) hits.push({ name: "문창귀인", basis: "일간", places: branchPlaces(mc), chars: BRANCHES[mc] });
  const hy = HONGYEOM[dayStemName];
  if (branchPlaces(hy).length) hits.push({ name: "홍염살", basis: "일간", places: branchPlaces(hy), chars: BRANCHES[hy] });

  // 기둥 기준: 백호대살, 괴강살
  for (const c of cols) {
    const name = pillarFromIndex(c.pillar.index).name;
    if (BAEKHO.has(name)) hits.push({ name: "백호대살", basis: "기둥", places: [`${c.label}주`], chars: name });
    if (GOEGANG.has(name)) hits.push({ name: "괴강살", basis: "기둥", places: [`${c.label}주`], chars: name });
  }

  // 귀문관살: 지지 두 글자가 짝이 될 때
  for (let i = 0; i < cols.length; i++) {
    for (let j = i + 1; j < cols.length; j++) {
      const a = cols[i].pillar.branch;
      const b = cols[j].pillar.branch;
      if (GWIMUN.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
        hits.push({ name: "귀문관살", basis: "지지 짝", places: [`${cols[i].label}지`, `${cols[j].label}지`], chars: `${BRANCHES[a]}${BRANCHES[b]}` });
      }
    }
  }

  const twelve = bases.map((b) => ({
    basis: b.basis,
    byPlace: Object.fromEntries(cols.map((c) => [`${c.label}지`, twelveSinsalOf(b.branch, c.pillar.branch)])) as Record<string, TwelveName>,
  }));
  return { hits, twelve };
}

export type SamjaeResult = { active: boolean; phase: "들삼재" | "눌삼재" | "날삼재" | null; years: number[] };

/**
 * 삼재(연지 기준). 신자진생은 인묘진년, 해묘미생은 사오미년, 인오술생은 신유술년, 사유축생은 해자축년에 3년간 든다.
 * 첫 해는 들삼재, 둘째 해는 눌삼재, 셋째 해는 날삼재.
 */
export function samjae(birthYearBranch: number, targetYear: number): SamjaeResult {
  const group = GROUP_OF.get(birthYearBranch)!;
  const firstBranch = [B("인"), B("사"), B("신"), B("해")][group];
  const targetBranch = (((targetYear - 4) % 12) + 12) % 12;
  const step = (targetBranch - firstBranch + 12) % 12;
  const phases = ["들삼재", "눌삼재", "날삼재"] as const;
  // 해당 해가 속한 삼재 기간의 3개 연도
  const years = step < 3 ? Array.from({ length: 3 }, (_, i) => targetYear - step + i) : [];
  return { active: step < 3, phase: step < 3 ? phases[step] : null, years };
}

