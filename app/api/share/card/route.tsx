import { ImageResponse } from "next/og";
import { clientIp, jsonResponse as json, makeLimiter } from "../../../../lib/http";
import { BirthBody, ConfigError, UserInputError, makeCard } from "../../../../lib/profile-service";
import { publicImage, shareFonts } from "../../../../lib/share-fonts";

/**
 * 내 사주 카드 공유 이미지(스토리 1080×1920). 요구사항 4.6, 8.2, 8.3.
 * 생년월일은 주소가 아니라 요청 본문(POST)으로만 받고, 이미지에도 넣지 않는다. 사주 글자·키워드·인생 테마만 들어간다.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NIGHT = "#04101E";
const HANJI = "#EFE4CC";
const INK = "#1A140F";
const GOLD = "#D9B46A";
const SEAL = "#A8321F";
const ELEMENT_BG = { wood: "#2F6E64", fire: "#A8321F", earth: "#B08A4A", metal: "#C9C4B8", water: "#16324A" } as const;

const limited = makeLimiter(10);

export async function POST(req: Request) {
  if (limited(clientIp(req))) return json({ error: "잠시 후에 다시 시도해 주세요." }, 429);

  let parsed;
  try {
    parsed = BirthBody.safeParse(await req.json());
  } catch {
    return json({ error: "요청 형식이 맞지 않아요." }, 400);
  }
  if (!parsed.success) return json({ error: "입력값을 확인해 주세요." }, 400);

  let result;
  try {
    result = await makeCard(parsed.data);
  } catch (e) {
    if (e instanceof UserInputError) return json({ error: e.message }, 400);
    if (e instanceof ConfigError) return json({ error: e.message }, 500);
    return json({ error: "이미지를 만드는 중 문제가 생겼어요." }, 500);
  }
  const { card } = result;

  const keywords = card.profile.keywords.map((k) => k.word);
  const strengthLine = `${card.strength.level} · ${card.structure}`;
  const text = [card.profile.theme, ...keywords, card.dayPillar, strengthLine, "내 사주 카드", "생일만 넣으면 무료로 볼 수 있어요", "하나에 300원, 결론부터", "사주300", ...card.pillars.flatMap((p) => [p.label, p.stem.ch, p.branch.ch, p.stem.label, p.branch.label])].join("");

  let fonts, scene;
  try {
    [fonts, scene] = await Promise.all([shareFonts(text), publicImage("banners/banner-3-haechi.jpg")]);
  } catch {
    return json({ error: "이미지에 쓸 글꼴을 불러오지 못했어요. 잠시 후 다시 시도해 주세요." }, 502);
  }

  const cols = card.pillars.length;
  const colW = cols === 4 ? 200 : 260;

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: 1080, height: 1920, background: NIGHT, color: HANJI, fontFamily: "Sans" }}>
        <div style={{ display: "flex", position: "relative", width: 1080, height: 760, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene} alt="" width={1080} height={1440} style={{ objectFit: "cover", objectPosition: "top" }} />
          <div style={{ display: "flex", position: "absolute", left: 56, top: 56, fontSize: 36, color: GOLD }}>사주300</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "-80px 56px 0",
            padding: 56,
            background: HANJI,
            color: INK,
            borderRadius: 28,
            outline: `2px solid ${GOLD}`,
            outlineOffset: -16,
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: SEAL }}>내 사주 카드</div>
          <div style={{ display: "flex", marginTop: 14, fontFamily: "Serif", fontWeight: 900, fontSize: 56, lineHeight: 1.3, wordBreak: "keep-all" }}>{card.profile.theme}</div>
          <div style={{ display: "flex", marginTop: 12, fontSize: 32, color: "#5b4a30" }}>{`${card.dayPillar} · ${strengthLine}`}</div>

          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 36 }}>
            {card.pillars.map((p) => (
              <div key={p.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: colW }}>
                <div style={{ display: "flex", fontSize: 26, color: "#5b4a30", marginBottom: 10 }}>{p.label}</div>
                {[p.stem, p.branch].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      width: colW,
                      height: 136,
                      marginBottom: 12,
                      borderRadius: 12,
                      background: ELEMENT_BG[c.element],
                      color: c.element === "metal" ? INK : HANJI,
                      fontFamily: "Serif",
                      fontWeight: 900,
                      fontSize: 72,
                    }}
                  >
                    <div style={{ display: "flex" }}>{c.ch}</div>
                    <div style={{ display: "flex", fontSize: 24, fontWeight: 700, fontFamily: "Sans" }}>{c.label}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20 }}>
            {keywords.map((w) => (
              <div key={w} style={{ display: "flex", padding: "10px 26px", borderRadius: 999, border: `2px solid ${SEAL}`, fontSize: 34, color: SEAL }}>
                {w}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "flex-end", paddingBottom: 72, gap: 12 }}>
          <div style={{ display: "flex", fontSize: 36, color: GOLD }}>생일만 넣으면 무료로 볼 수 있어요</div>
          <div style={{ display: "flex", fontSize: 30, color: HANJI }}>하나에 300원, 결론부터</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts, headers: { "cache-control": "no-store" } },
  );
}
