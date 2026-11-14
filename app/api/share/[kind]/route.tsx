import { ImageResponse } from "next/og";
import { getVerdict } from "@/lib/result";
import { publicImage, shareFonts } from "@/lib/share-fonts";
import { GUIDE_NAME, getQuestion } from "@/lib/questions";

export const runtime = "nodejs";

const NIGHT = "#04101E";
const HANJI = "#EFE4CC";
const INK = "#1A140F";
const GOLD = "#D9B46A";
const SEAL = "#A8321F";

const BANNER = { assi: "banner-1-assi.jpg", doryeong: "banner-2-doryeong.jpg", haechi: "banner-3-haechi.jpg" } as const;

function Seal({ size }: { size: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        width: size,
        height: size,
        border: `${Math.round(size / 36)}px solid ${SEAL}`,
        color: SEAL,
        fontFamily: "Serif",
        fontWeight: 900,
        fontSize: size * 0.4,
        transform: "rotate(-8deg)",
      }}
    >
      {["判", "定", "三", "百"].map((c) => (
        <div key={c} style={{ display: "flex", width: "50%", height: "50%", alignItems: "center", justifyContent: "center" }}>
          {c}
        </div>
      ))}
    </div>
  );
}

export async function GET(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (kind !== "story" && kind !== "og") return new Response("Not found", { status: 404 });

  const order = new URL(req.url).searchParams.get("order") ?? "";
  // 생년월일 등 개인정보는 이미지에 넣지 않는다: 판정·처방·풀이꾼만 읽는다.
  const v = getVerdict(order);
  if (!v) return new Response("Not found", { status: 404 });
  const question = getQuestion(v.questionId)!;
  const guideName = GUIDE_NAME[v.guide];

  const texts = [
    v.headline,
    v.prescription,
    question.title,
    guideName,
    "이번 달 처방",
    "질문 하나에 300원, 결론부터",
    "사주300",
    "좋은 흐름조심할 흐름",
    "의 풀이 · ",
    "判定三百",
  ].join("");
  const [fonts, scene, haechi] = await Promise.all([
    shareFonts(texts),
    publicImage(`banners/${BANNER[v.guide]}`),
    publicImage(`characters/haechi-${v.tone === "good" ? "joy" : "think"}.png`),
  ]);
  const flow = v.tone === "good" ? "좋은 흐름" : "조심할 흐름";

  if (kind === "og") {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: 1200, height: 630, background: NIGHT, color: HANJI, fontFamily: "Sans" }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700, padding: 56 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 28, color: GOLD }}>{`${guideName}의 풀이 · ${flow}`}</div>
              <div style={{ display: "flex", marginTop: 24, fontFamily: "Serif", fontWeight: 900, fontSize: 68, lineHeight: 1.25, wordBreak: "keep-all" }}>
                {v.headline}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", fontFamily: "Serif", fontWeight: 900, fontSize: 36, color: GOLD }}>사주300</div>
              <Seal size={110} />
            </div>
          </div>
          <div style={{ display: "flex", width: 500, height: 630, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={scene} alt="" width={500} height={667} style={{ objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts },
    );
  }

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: 1080, height: 1920, background: NIGHT, color: HANJI, fontFamily: "Sans" }}>
        <div style={{ display: "flex", position: "relative", width: 1080, height: 780, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene} alt="" width={1080} height={1440} style={{ objectFit: "cover", objectPosition: "top" }} />
          <div style={{ display: "flex", position: "absolute", left: 56, top: 56, fontSize: 34, color: GOLD }}>{`${guideName}의 풀이`}</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "-60px 56px 0",
            padding: 64,
            background: HANJI,
            color: INK,
            borderRadius: 28,
            outline: `2px solid ${GOLD}`,
            outlineOffset: -16,
          }}
        >
          <div style={{ display: "flex", fontSize: 32, color: v.tone === "good" ? "#1E5A50" : SEAL }}>{flow}</div>
          <div style={{ display: "flex", marginTop: 20, fontFamily: "Serif", fontWeight: 900, fontSize: 72, lineHeight: 1.3, wordBreak: "keep-all" }}>
            {v.headline}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            <Seal size={170} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", margin: "48px 56px 0", gap: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={haechi} alt="" width={200} height={200} style={{ objectFit: "contain" }} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontSize: 30, color: GOLD }}>이번 달 처방</div>
            <div style={{ display: "flex", marginTop: 8, fontFamily: "Serif", fontWeight: 900, fontSize: 44, lineHeight: 1.35, wordBreak: "keep-all" }}>
              {v.prescription}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "flex-end", justifyContent: "center", paddingBottom: 72, fontSize: 34, color: GOLD }}>
          질문 하나에 300원, 결론부터
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts },
  );
}


