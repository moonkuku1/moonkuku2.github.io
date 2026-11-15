/** 서버 API들이 함께 쓰는 작은 도구들 */

/** 한 서버 안에서만 세는 간단한 횟수 제한(AI 비용 보호). 분당 max번까지. */
export function makeLimiter(max: number) {
  const hits = new Map<string, number[]>();
  return (ip: string): boolean => {
    const now = Date.now();
    const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 5000) hits.clear();
    return list.length > max;
  };
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";

/** 한국 시각 기준 오늘 */
export function kstToday() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export const jsonResponse = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
