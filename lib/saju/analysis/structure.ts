import { BRANCHES, STEMS } from "../ganji";
import type { FourPillars } from "../pillars";
import { tenGod, type TenGod } from "./elements";
import { mainStemOf } from "./tables";

/**
 * 격국 (방식 A: 월지 본기 기준, docs/saju-decisions.md 2-2).
 * 월지 본기 천간이 일간에게 무슨 십성인지로 격을 정한다.
 * 비견이면 건록격, 겁재이면 양간(갑병무경임)은 양인격·음간은 월겁격이다.
 * 투출(천간에 드러남)과 종격·화격은 따지지 않는다.
 */
export type StructureName =
  | "정관격"
  | "편관격"
  | "정인격"
  | "편인격"
  | "식신격"
  | "상관격"
  | "정재격"
  | "편재격"
  | "건록격"
  | "양인격"
  | "월겁격";

export type StructureAnalysis = {
  name: StructureName;
  /** 격을 정한 십성(월지 본기 기준) */
  god: TenGod;
  /** 기준이 된 월지와 그 본기 천간 */
  basis: { branch: string; stem: string };
};

const BY_GOD: Record<Exclude<TenGod, "비견" | "겁재">, StructureName> = {
  정관: "정관격",
  편관: "편관격",
  정인: "정인격",
  편인: "편인격",
  식신: "식신격",
  상관: "상관격",
  정재: "정재격",
  편재: "편재격",
};

export function analyzeStructure(p: FourPillars): StructureAnalysis {
  const main = mainStemOf(p.month.branch);
  const god = tenGod(p.day.stem, main);
  let name: StructureName;
  if (god === "비견") name = "건록격";
  else if (god === "겁재") name = p.day.stem % 2 === 0 ? "양인격" : "월겁격";
  else name = BY_GOD[god];
  return { name, god, basis: { branch: BRANCHES[p.month.branch], stem: STEMS[main] } };
}
