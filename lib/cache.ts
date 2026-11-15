import { createHash } from "node:crypto";
import type { Chart } from "./saju/chart";

/**
 * 답변 캐시 (요구사항 3.8): 키는 (명식 해시 + 질문 ID + 기준 연월)이다.
 * 같은 키의 답이 있으면 AI를 다시 부르지 않는다. 저장 위치는 나중에 Supabase로 바꿀 수 있게 `KeyValueStore`로 감쌌다(요구사항 7.6: 키가 없으면 개발용 임시 저장소).
 */
export type Entry<T> = {
  value: T;
  /** 프롬프트·검수 기준 버전. 바뀌면 캐시를 쓰지 않고 새로 만든다 */
  promptVersion: string;
  /** 샘플 문장 모드로 만든 항목인지. AI가 켜져 있으면 샘플 항목은 쓰지 않는다 */
  sample: boolean;
  createdAt: string;
};

export interface KeyValueStore<T> {
  get(key: string): Promise<Entry<T> | undefined>;
  set(key: string, entry: Entry<T>): Promise<void>;
}

/** 서버 한 대 안에서만 유지되는 임시 저장소. 오래된 것부터 지운다. */
export class MemoryStore<T> implements KeyValueStore<T> {
  private map = new Map<string, Entry<T>>();
  constructor(private max = 2000) {}
  async get(key: string) {
    return this.map.get(key);
  }
  async set(key: string, entry: Entry<T>) {
    this.map.delete(key);
    this.map.set(key, entry);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string);
  }
  get size() {
    return this.map.size;
  }
}

/** 명식 해시: 사주 글자·성별·출생 시각(대운 시작 나이에 쓰임)을 합쳐 한 줄로 만든다. 원래 값은 되돌릴 수 없다. */
export function chartHash(chart: Chart): string {
  const p = chart.pillars;
  const canonical = JSON.stringify({
    p: [p.year.index, p.month.index, p.day.index, p.hour ? p.hour.index : null],
    g: chart.input.gender,
    s: chart.solarDate,
    c: chart.clock ? [chart.clock.hour, chart.clock.minute] : null,
    l: chart.input.options?.lateZiSameDay ?? false,
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

export type Reference = { year: number; month: number };

export function answerKey(hash: string, questionId: string, ref: Reference): string {
  return `${hash}:${questionId}:${ref.year}-${String(ref.month).padStart(2, "0")}`;
}

/** 캐시에서 쓸 수 있는 항목인가: 프롬프트 버전이 같고, AI가 켜져 있으면 샘플로 만든 항목은 쓰지 않는다 */
export function usable<T>(entry: Entry<T> | undefined, promptVersion: string, liveMode: boolean): entry is Entry<T> {
  return !!entry && entry.promptVersion === promptVersion && !(liveMode && entry.sample);
}

type Stores = { profiles: MemoryStore<unknown>; answers: MemoryStore<unknown> };
const g = globalThis as unknown as { __saju300Stores?: Stores };
/** 개발 서버가 코드를 다시 읽어도 저장소가 비지 않도록 전역에 둔다 */
export const defaultStores: Stores = (g.__saju300Stores ??= { profiles: new MemoryStore(), answers: new MemoryStore() });
