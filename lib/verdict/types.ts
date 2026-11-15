import type { Group } from "../signals/context";

/** 레시피에 적는 신호 하나: 어떤 신호를 얼마나(weight) 어느 방향(dir)으로 쓰는지 */
export type SignalRef = { key: string; weight: number; dir: "+" | "-" };

/** 판정 규칙. 레시피의 verdictRule을 코드가 읽는 모양으로 적은 것이다. */
export type RuleSpec =
  | { kind: "timing-month"; months?: number; top?: number; closeGap?: number }
  | { kind: "timing-year"; years?: number; top?: number; closeGap?: number }
  | { kind: "best-worst-month"; months?: number; top?: number }
  | { kind: "best-worst-year"; years?: number; top?: number }
  | { kind: "yesno"; yesAt: number; noAt: number; at?: "year" | "month" }
  | { kind: "yesno+timing-month"; yesAt: number; noAt: number; months?: number; top?: number; closeGap?: number }
  | { kind: "grade"; highAt: number; midAt: number; at?: "year" | "month" }
  | { kind: "score"; at?: "year" | "month" }
  | { kind: "profile" }
  | { kind: "cause"; top?: number }
  | { kind: "monthly-graph"; months?: number; top?: number }
  | { kind: "needs-partner" };

export type Recipe = {
  id: string;
  verdictType: string;
  timingScope?: string;
  signals: SignalRef[];
  rule: RuleSpec;
  /** "no-assertion"(단정 금지), "consult:의료|법률|투자"(전문가 상담 권유) */
  safety: string[];
  source: "specific" | "default";
};

export type Confidence = "강" | "중" | "약";

export type SignalHit = { key: string; label: string; plain: string; weight: number; scope: "natal" | "year" | "month" };

export type MonthPick = { label: string; year: number; month: number; sajuYear: number; order: number; term: string; date: string; score: number };
export type YearPick = { year: number; score: number };

export type VerdictValue =
  | { kind: "timing-month"; picks: MonthPick[]; scores: MonthPick[] }
  | { kind: "timing-year"; picks: YearPick[]; scores: YearPick[] }
  | { kind: "best-worst-month"; best: MonthPick[]; worst: MonthPick[]; scores: MonthPick[] }
  | { kind: "best-worst-year"; best: YearPick[]; worst: YearPick[]; scores: YearPick[] }
  | { kind: "yesno"; answer: "예" | "아니오" | "조건부"; net: number }
  | { kind: "yesno+timing-month"; answer: "예" | "아니오" | "조건부"; net: number; picks: MonthPick[]; scores: MonthPick[] }
  | { kind: "grade"; grade: "상" | "중" | "하"; net: number }
  | { kind: "score"; score: number; grade: "상" | "중" | "하"; net: number }
  | {
      kind: "profile";
      dominantGroup: Group;
      strengthLevel: string;
      structure: string;
      helpfulElements: string[];
      avoidElements: string[];
      net: number;
    }
  | { kind: "cause"; causes: SignalHit[]; net: number }
  | { kind: "monthly-graph"; months: MonthPick[]; best: MonthPick[]; worst: MonthPick[]; yearNet: number }
  | { kind: "needs-partner" };

export type Safety = { noAssertion: boolean; consult: ("의료" | "법률" | "투자")[] };

export type Verdict = {
  questionId: string;
  recipeId: string;
  recipeSource: "specific" | "default";
  /** 질문 데이터의 답변 형식(answerFormat) */
  verdictType: string;
  value: VerdictValue;
  confidence: Confidence;
  /** 확신도를 정한 점수: 지지 신호 합 − 반대 신호 합 */
  confidenceNet: number;
  /** 확신도를 낮춘 이유 */
  confidenceNotes: ("time-unknown" | "close-gap")[];
  signalsFor: SignalHit[];
  signalsAgainst: SignalHit[];
  safety: Safety;
  reference: { year: number; month: number };
};
