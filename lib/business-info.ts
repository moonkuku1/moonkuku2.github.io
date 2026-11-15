/**
 * 사업자 정보. 사업자등록과 통신판매업 신고가 끝나면 아래 빈 칸을 채우면 바닥글과 약관·개인정보 페이지에 자동으로 나타난다.
 * 비어 있는 칸은 화면에 나오지 않는다. 없는 정보를 지어서 넣지 않는다.
 */
export const BUSINESS = {
  /** 서비스 이름 */
  service: "사주300",
  /** 상호(법인명 또는 개인사업자 상호) */
  companyName: "",
  /** 대표자 */
  ceo: "",
  /** 사업자등록번호 */
  businessNumber: "",
  /** 통신판매업 신고번호 */
  mailOrderNumber: "",
  /** 사업장 주소 */
  address: "",
  /** 고객 문의 이메일 */
  email: "",
  /** 고객 문의 전화(선택) */
  phone: "",
  /** 개인정보 보호책임자 이름 */
  privacyOfficer: "",
} as const;

export type BusinessKey = keyof typeof BUSINESS;

const LABEL: Record<BusinessKey, string> = {
  service: "서비스",
  companyName: "상호",
  ceo: "대표자",
  businessNumber: "사업자등록번호",
  mailOrderNumber: "통신판매업 신고번호",
  address: "주소",
  email: "문의 이메일",
  phone: "문의 전화",
  privacyOfficer: "개인정보 보호책임자",
};

/** 채워진 항목만 [이름, 값]으로 돌려준다 */
export function filledBusinessInfo(info: Record<string, string> = BUSINESS): [string, string][] {
  return (Object.keys(LABEL) as BusinessKey[]).filter((k) => k !== "service" && info[k]?.trim()).map((k) => [LABEL[k], info[k]]);
}
