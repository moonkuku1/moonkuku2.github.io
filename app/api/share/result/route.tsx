import { ImageResponse } from "next/og";
import { clientIp, jsonResponse as json, makeLimiter } from "../../../../lib/http";
import { AnswerGenerationError } from "../../../../lib/llm/run";
import { AnswerBody, makeResult } from "../../../../lib/result-service";
import { publicImage, shareFonts } from "../../../../lib/share-fonts";

/**
 * 판정 카드 공유 이미지(스토리 1080×1920). 요구사항 8.2, 8.3.
 * 풀이꾼 장면 → 한지 판정 카드(첫 줄 결론, 판정 도장) → 이번 달 처방 + 해치 → "질문 하나에 300원, 결론부터".
 * 생년월일·사주 글자·풀이 본문은 넣지 않는다. 생년월일은 요청 본문(POST)으로만 받는다.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NIGHT = "#04101E";
const HANJI = "#EFE4CC";
const INK = "#1A140F";
const GOLD = "#D9B46A";
const SEAL = "#A8321F";
const BANNER = { assi: "banner-1-assi.jpg", doryeong: "banner-2-doryeong.jpg", haechi: "banner-3-haechi.jpg" } as const;

const limited = makeLimiter(10);

function Seal({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: size, height: size, border: `${Math.round(size / 36)}px solid ${SEAL}`, color: SEAL, fontFamily: "Serif", fontWeight: 900, fontSize: size * 0.4, transform: "rotate(-8deg)" }}>
      {["判", "定", "三", "百"].map((c) => (
        <div key={c} style={{ display: "flex", width: "50%", height: "50%", alignItems: "center", justifyContent: "center" }}>
          {c}
        </div>
      ))}
    </div>
  );
}

export async function POST(req: Request) {
  if (limited(clientIp(req))) return json({ error: "잠시 후에 다시 시도해 주세요." }, 429);
  let parsed;
  try {
    parsed = AnswerBody.safeParse(await req.json());
  } catch {
    return json({ error: "요청 형식이 맞지 않아요." }, 400);
  }
  if (!parsed.success) return json({ error: "입력값을 확인해 주세요." }, 400);

  let r;
  try {
    r = await makeResult(parsed.data);
  } catch (e) {
    if (e instanceof AnswerGenerationError) return json({ error: e.message, refund: true }, 502);
    const msg = (e as Error).message ?? "";
    if (/날짜|시각|범위|음력|윤|없는 질문/.test(msg)) return json({ error: msg }, 400);
    return json({ error: "이미지를 만드는 중 문제가 생겼어요." }, 500);
  }
  if (r.status !== "ok") return json({ error: "궁합은 두 사람의 정보가 필요해요." }, 400);

  const flow = r.tone === "good" ? "좋은 흐름" : "조심할 흐름";
  const text = [r.answer.headline, r.answer.action.do, r.answer.action.by, r.title, r.guideName, r.categoryName, flow, "이번 달 처방", "질문 하나에 300원, 결론부터", "사주300", "판정"].join("");
  let fonts, scene, haechi;
  try {
    [fonts, scene, haechi] = await Promise.all([shareFonts(text), publicImage(`banners/${BANNER[r.guide]}`), publicImage(`characters/haechi-${r.tone === "good" ? "joy" : "think"}.png`)]);
  } catch {
    return json({ error: "이미지에 쓸 글꼴을 불러오지 못했어요. 잠시 후 다시 시도해 주세요." }, 502);
  }

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: 1080, height: 1920, background: NIGHT, color: HANJI, fontFamily: "Sans" }}>
        <div style={{ display: "flex", position: "relative", width: 1080, height: 780, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene} alt="" width={1080} height={1440} style={{ objectFit: "cover", objectPosition: "top" }} />
          <div style={{ display: "flex", position: "absolute", left: 56, top: 56, fontSize: 34, color: GOLD }}>{`${r.guideName}의 풀이 · ${r.categoryName}`}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", margin: "-60px 56px 0", padding: 64, background: HANJI, color: INK, borderRadius: 28, outline: `2px solid ${GOLD}`, outlineOffset: -16 }}>
          <div style={{ display: "flex", fontSize: 32, color: r.tone === "good" ? "#1E5A50" : SEAL }}>{flow}</div>
          <div style={{ display: "flex", marginTop: 20, fontFamily: "Serif", fontWeight: 900, fontSize: 72, lineHeight: 1.3, wordBreak: "keep-all" }}>{r.answer.headline}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            <Seal size={170} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", margin: "48px 56px 0", gap: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={haechi} alt="" width={200} height={200} style={{ objectFit: "contain" }} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontSize: 30, color: GOLD }}>이번 달 처방</div>
            <div style={{ display: "flex", marginTop: 8, fontFamily: "Serif", fontWeight: 900, fontSize: 44, lineHeight: 1.35, wordBreak: "keep-all" }}>{r.answer.action.do}</div>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "flex-end", justifyContent: "center", paddingBottom: 72, fontSize: 34, color: GOLD }}>질문 하나에 300원, 결론부터</div>
      </div>
    ),
    { width: 1080, height: 1920, fonts, headers: { "cache-control": "no-store" } },
  );
}
