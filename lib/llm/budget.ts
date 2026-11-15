/**
 * AI 호출 하루 한도 (비용 보호).
 * 한국 시각 기준 하루 동안 AI를 몇 번까지 부를지 센다. 환경변수 LLM_DAILY_CAP(기본 300번)으로 바꾼다. 0이면 AI를 부르지 않는다.
 * 주의: 이 숫자는 서버 한 대 안에서만 센다. Vercel처럼 서버가 여러 대로 나뉘면 한도가 서버마다 따로 적용되므로
 * 진짜 상한은 AI 회사 콘솔의 월 사용 한도(예산 알림·한도 설정)로 꼭 함께 걸어 두어야 한다.
 */
export class BudgetExceededError extends Error {
  constructor() {
    super("오늘 AI 사용 한도에 도달했어요");
  }
}

const g = globalThis as unknown as { __saju300Budget?: { day: string; used: number } };

function today() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function dailyCap(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.LLM_DAILY_CAP);
  return Number.isFinite(n) && n >= 0 && env.LLM_DAILY_CAP !== undefined && env.LLM_DAILY_CAP !== "" ? Math.floor(n) : 300;
}

/** 한 번 부르기 전에 호출한다. 한도를 넘으면 오류를 던지고, 아니면 한 번 센다. */
export function spend(env: Record<string, string | undefined> = process.env): void {
  const state = (g.__saju300Budget ??= { day: today(), used: 0 });
  if (state.day !== today()) {
    state.day = today();
    state.used = 0;
  }
  if (state.used >= dailyCap(env)) throw new BudgetExceededError();
  state.used += 1;
}

export function usedToday(): number {
  const s = g.__saju300Budget;
  return s && s.day === today() ? s.used : 0;
}

/** 시험용: 오늘 사용 횟수를 0으로 되돌린다 */
export function resetBudget(): void {
  g.__saju300Budget = { day: today(), used: 0 };
}
