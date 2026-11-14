/** 判定三百 도장: 2×2 배치, -8도 기울임, 붉은 테두리. animate 가 true면 열릴 때 찍힌다. */
export function Seal({ animate = true, size = 72 }: { animate?: boolean; size?: number }) {
  return (
    <div
      aria-hidden="true"
      className={`${animate ? "stamp-anim" : ""} grid shrink-0 grid-cols-2 border-2 border-seal font-serif font-black leading-none text-seal`}
      style={{ width: size, height: size, fontSize: size * 0.4, transform: "rotate(-8deg)" }}
    >
      {["判", "定", "三", "百"].map((c) => (
        <span key={c} className="flex items-center justify-center">
          {c}
        </span>
      ))}
    </div>
  );
}
