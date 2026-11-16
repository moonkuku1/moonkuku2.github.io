/** 오행 색(디자인 문서: 명식표에만 쓴다). 값은 app/globals.css의 토큰이다. */
export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export const ELEMENT_COLOR: Record<Element, string> = {
  wood: "var(--color-oh-wood)",
  fire: "var(--color-oh-fire)",
  earth: "var(--color-oh-earth)",
  metal: "var(--color-oh-metal)",
  water: "var(--color-oh-water)",
};

export const ELEMENT_NAME: Record<Element, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};
