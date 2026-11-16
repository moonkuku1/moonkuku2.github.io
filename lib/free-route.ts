import { clientIp, jsonResponse as json, makeLimiter } from "./http";
import { BirthBody, UserInputError } from "./profile-service";

/**
 * 무료 풀이 API 공통 처리: 생년월일은 요청 본문(POST)으로만 받고 저장하지 않으며, 로그에도 남기지 않는다.
 * 요청이 몰리지 않게 한 주소(IP)당 횟수를 제한한다.
 */
export function freeHandler<T>(name: string, make: (b: BirthBody) => T) {
  const limited = makeLimiter(60);
  return async function POST(req: Request) {
    if (limited(clientIp(req))) return json({ error: "잠시 후에 다시 시도해 주세요." }, 429);
    let parsed;
    try {
      parsed = BirthBody.safeParse(await req.json());
    } catch {
      return json({ error: "요청 형식이 맞지 않아요." }, 400);
    }
    if (!parsed.success) return json({ error: "입력값을 확인해 주세요." }, 400);
    try {
      return json({ status: "ok", result: make(parsed.data) });
    } catch (e) {
      if (e instanceof UserInputError) return json({ error: e.message }, 400);
      console.error(`[${name} 계산 오류]`, ((e as Error).message ?? "").slice(0, 200));
      return json({ error: "사주를 계산하는 중 문제가 생겼어요." }, 500);
    }
  };
}