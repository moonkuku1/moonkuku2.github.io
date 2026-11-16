/** 무료 풀이 목록. 홈 바로가기, /free 목록, 사이트맵이 함께 쓴다. */
export const FREE_TOOLS = [
  { slug: "sinsal", icon: "🌟", title: "내 신살 조회", desc: "도화·역마·화개·천을귀인과 올해 삼재를 생년월일로 바로 찾아요.", pageTitle: "무료 신살 조회", intro: "생년월일을 넣으면 내 사주에 있는 신살과 올해 삼재를 바로 알려 드려요. 가입도 결제도 필요 없어요." },
  { slug: "ohaeng", icon: "☯️", title: "내 오행 분포", desc: "목·화·토·금·수 중 내 사주에 많은 기운과 부족한 기운을 확인해요.", pageTitle: "무료 오행 분포", intro: "내 사주에 목·화·토·금·수가 각각 얼마나 있는지 막대로 보여 드려요." },
  { slug: "ilgan", icon: "🪞", title: "내 일간 알아보기", desc: "갑·을·병·정·무·기·경·신·임·계 중 내 일간과 기본 성향을 알아봐요.", pageTitle: "무료 일간 알아보기", intro: "사주의 '나'를 뜻하는 일간 한 글자로 기본 성향을 알려 드려요. 성별은 묻지 않아요." },
  { slug: "tti", icon: "🐯", title: "띠 운세", desc: "내 띠와 올해의 관계(합·충 등)와 올해 삼재 여부를 확인해요.", pageTitle: "무료 띠 운세", intro: "내 띠와 올해 지지가 어떤 관계인지, 올해 삼재에 해당하는지 알려 드려요. 태어난 시간과 성별은 묻지 않아요." },
] as const;
export type FreeSlug = (typeof FREE_TOOLS)[number]["slug"];