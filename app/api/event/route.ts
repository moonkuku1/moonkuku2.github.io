import { EventBody } from "../../../lib/events";
import { clientIp, makeLimiter } from "../../../lib/http";

/**
 * 이용 흐름 기록 받기. 받은 값은 서버 로그에 한 줄로만 남긴다(Vercel의 Logs에서 "[event]"로 찾는다).
 * IP·기기 정보는 기록하지 않는다. DB(Supabase)가 생기면 같은 값을 표에 쌓는다.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limited = makeLimiter(120);

export async function POST(req: Request) {
  if (limited(clientIp(req))) return new Response(null, { status: 429 });
  let parsed;
  try {
    parsed = EventBody.safeParse(await req.json());
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!parsed.success) return new Response(null, { status: 400 });
  const { name, sid, path, props } = parsed.data;
  console.log("[event]", JSON.stringify({ t: new Date().toISOString(), name, sid, path, ...props }));
  return new Response(null, { status: 204 });
}
