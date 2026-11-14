import { readFile } from "node:fs/promises";
import path from "node:path";

/** Google Fonts에서 필요한 글자만 담은 작은 글꼴 파일을 받아 온다. (공유 이미지는 서버에서 만든다) */
async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const chars = Array.from(new Set(text + " 0123456789")).join("");
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(chars)}`,
    )
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`글꼴을 찾지 못했어요: ${family}`);
  return (await fetch(url)).arrayBuffer();
}

export async function shareFonts(text: string) {
  const [serif, sans] = await Promise.all([
    googleFont("Noto Serif KR", 900, text),
    googleFont("Noto Sans KR", 700, text),
  ]);
  return [
    { name: "Serif", data: serif, weight: 900 as const, style: "normal" as const },
    { name: "Sans", data: sans, weight: 700 as const, style: "normal" as const },
  ];
}

/** public 폴더의 그림을 data URI로 바꿔 이미지 안에 넣는다. */
export async function publicImage(rel: string): Promise<string> {
  const buf = await readFile(path.join(process.cwd(), "public", "images", "saju300-images", rel));
  const mime = rel.endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}
