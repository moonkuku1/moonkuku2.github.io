import { ImageResponse } from "next/og";
import { publicImage, shareFonts } from "../lib/share-fonts";

/**
 * 링크 미리보기(OG) 이미지 1200×630: 왼쪽 문구, 오른쪽 해치 삼백이. 개인정보는 넣지 않는다(디자인 전달서 ‘공유 카드’).
 * 글꼴을 받아 오는 데 실패하면 그림 파일 주소로 보내 링크 미리보기가 비지 않게 한다.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "사주300 · 질문 하나에 300원, 결론부터";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NIGHT = "#04101E";
const HANJI = "#EFE4CC";
const GOLD = "#D9B46A";

export default async function OpengraphImage() {
  const line1 = "내 사주, 결론부터";
  const line2 = "말해 드려요";
  const sub = "질문 하나에 300원 · 내 사주 카드는 무료";
  let fonts, scene;
  try {
    [fonts, scene] = await Promise.all([shareFonts(`${line1}${line2}${sub}사주300`), publicImage("banners/banner-3-haechi.jpg")]);
  } catch {
    return new Response(null, { status: 302, headers: { location: "/images/saju300-images/banners/banner-3-haechi.jpg" } });
  }
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: 1200, height: 630, background: NIGHT, color: HANJI, fontFamily: "Sans" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 740, padding: "0 70px" }}>
          <div style={{ display: "flex", fontSize: 34, color: GOLD, fontWeight: 700 }}>사주300</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 24, fontFamily: "Serif", fontWeight: 900, fontSize: 68, lineHeight: 1.2 }}>
            <div style={{ display: "flex" }}>{line1}</div>
            <div style={{ display: "flex" }}>{line2}</div>
          </div>
          <div style={{ display: "flex", marginTop: 32, fontSize: 28, color: "#A3A9AC", fontWeight: 700 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", position: "relative", width: 460, height: 630 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene} alt="" width={460} height={630} style={{ width: 460, height: 630, objectFit: "cover", objectPosition: "50% 20%" }} />
          <div style={{ display: "flex", position: "absolute", left: 0, top: 0, width: 160, height: 630, background: "linear-gradient(to right, #04101E, rgba(4,16,30,0))" }} />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
