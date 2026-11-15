import { clientIp, jsonResponse as json, makeLimiter } from "../../../lib/http";
import { BirthBody, ConfigError, UserInputError, makeCard } from "../../../lib/profile-service";

/**
 * 무료 사주 프로필 카드 API (요구사항 4.6, 7.1): 가입 없이 쓰고, 생년월일은 서버에 저장하지 않는다.
 * 요청 본문(POST)으로만 받고 로그에 남기지 않는다. 응답에도 생년월일은 넣지 않는다.
 * 저장되는 것은 명식을 비밀 값과 섞어 만든 키로 둔 사주 프로필(키워드 문장)뿐이다.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limited = makeLimiter(30);

export async function POST(req: Request) {
  if (limited(clientIp(req))) return json({ error: "잠시 후에 다시 시도해 주세요." }, 429);

  let parsed;
  try {
    parsed = BirthBody.safeParse(await req.json());
  } catch {
    return json({ error: "요청 형식이 맞지 않아요." }, 400);
  }
  if (!parsed.success) return json({ error: "입력값을 확인해 주세요.", fields: parsed.error.issues.map((i) => i.path.join(".")) }, 400);

  try {
    const { card, sample } = await makeCard(parsed.data);
    return json({ status: "ok", sample, card });
  } catch (e) {
    if (e instanceof UserInputError) return json({ error: e.message }, 400);
    if (e instanceof ConfigError) return json({ error: e.message }, 500);
    console.error("[프로필 계산 오류]", ((e as Error).message ?? "").slice(0, 200));
    return json({ error: "사주를 계산하는 중 문제가 생겼어요." }, 500);
  }
}
