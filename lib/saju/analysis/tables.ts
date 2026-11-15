import { STEMS, BRANCHES } from "../ganji";

/** 오행 번호: 목0 화1 토2 금3 수4 (상생 순서와 같다: 목→화→토→금→수→목) */
export type Element = 0 | 1 | 2 | 3 | 4;
export const ELEMENT_NAMES = ["목", "화", "토", "금", "수"] as const;

/** 천간 오행: 갑을 목, 병정 화, 무기 토, 경신 금, 임계 수 */
export const STEM_ELEMENT: Element[] = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
/** 지지 오행: 자 수, 축 토, 인 목, 묘 목, 진 토, 사 화, 오 화, 미 토, 신 금, 유 금, 술 토, 해 수 */
export const BRANCH_ELEMENT: Element[] = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];

/** 천간 음양: 갑병무경임은 양(true), 을정기신계는 음(false) */
export const stemYang = (stem: number) => stem % 2 === 0;

/**
 * 지장간(지지 속에 숨은 천간). 배열 마지막이 본기(주된 기운), 앞쪽이 여기·중기.
 * 널리 쓰는 표다: 자 임계, 축 계신기, 인 무병갑, 묘 갑을, 진 을계무, 사 무경병, 오 병기정, 미 정을기, 신 무임경, 유 경신, 술 신정무, 해 무갑임.
 */
const H = (s: string) => STEMS.indexOf(s as (typeof STEMS)[number]);
export const HIDDEN_STEMS: number[][] = [
  [H("임"), H("계")], // 자
  [H("계"), H("신"), H("기")], // 축
  [H("무"), H("병"), H("갑")], // 인
  [H("갑"), H("을")], // 묘
  [H("을"), H("계"), H("무")], // 진
  [H("무"), H("경"), H("병")], // 사
  [H("병"), H("기"), H("정")], // 오
  [H("정"), H("을"), H("기")], // 미
  [H("무"), H("임"), H("경")], // 신
  [H("경"), H("신")], // 유
  [H("신"), H("정"), H("무")], // 술
  [H("무"), H("갑"), H("임")], // 해
];

/** 지지의 본기 천간 */
export const mainStemOf = (branch: number) => HIDDEN_STEMS[branch][HIDDEN_STEMS[branch].length - 1];

export const B = (s: string) => BRANCHES.indexOf(s as (typeof BRANCHES)[number]);
export const S = (s: string) => STEMS.indexOf(s as (typeof STEMS)[number]);

/** 오행 a가 b를 생하는가 (목→화→토→금→수→목) */
export const generates = (a: Element, b: Element) => (a + 1) % 5 === b;
/** 오행 a가 b를 극하는가 (목→토, 토→수, 수→화, 화→금, 금→목) */
export const controls = (a: Element, b: Element) => (a + 2) % 5 === b;
