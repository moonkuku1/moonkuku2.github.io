import { clientIp, jsonResponse as json, makeLimiter } from "../../../../lib/http";
import { makeSinsal } from "../../../../lib/free-sinsal";
import { BirthBody, UserInputError } from "../../../../lib/profile-service";

/** 무료 신살 조회 API: 생년월일은 요청 본문으로만 받고 저장하지 않는다. AI를 쓰지 않는다. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limited = makeLimiter(60);

export async function POST(req: Request) {
  if (limited(clientIp(req))) return json({ error: "잠시 후에 다시 시도해 주세요." }, 429);
  let parsed;
  try {
    parsed = BirthBody.safeParse(await req.json());
  } catch {
    return json({ error: "요청 형식이 맞지 않아요." }, 400);
  }
  if (!parsed.success) return json({ error: "입력값을 확인해 주세요." }, 400);
  try {
    return json({ status: "ok", result: makeSinsal(parsed.data) });
  } catch (e) {
    if (e instanceof UserInputError) return json({ error: e.message }, 400);
    console.error("[신살 계산 오류]", ((e as Error).message ?? "").slice(0, 200));
    return json({ error: "사주를 계산하는 중 문제가 생겼어요." }, 500);
  }
}
