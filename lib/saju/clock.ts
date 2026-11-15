/**
 * 출생 시각 보정 (요구사항 1.5).
 * 사용자가 말하는 "그때 시계 시각"을 사주 계산에 쓰는 한국 표준시(UTC+9) 시각으로 바꾼다.
 * 한국의 서머타임·표준시 변경 기록은 표준 시간대 자료(IANA tz, Node에 내장된 Asia/Seoul)를 쓴다.
 *  - 서머타임: 1948~1951, 1955~1960, 1987~1988년 여름
 *  - 표준시: 1908~1911, 1954-03-21~1961-08-09는 UTC+8:30 (그 밖에는 UTC+9)
 */
export type ClockMode =
  /** 기본값: 서머타임만 한 시간 뺀다. 표준시가 UTC+8:30이던 시기는 시계 시각을 그대로 쓴다. */
  | "dst-only"
  /** 서머타임을 빼고, UTC+8:30이던 시기는 30분을 더해 항상 UTC+9 기준으로 맞춘다. */
  | "utc9";

export type ClockResult = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 그때 시계가 서머타임 중이었는지 */
  dst: boolean;
  /** 그때 시계의 UTC 차이(분). 예: 540 = UTC+9 */
  offsetMinutes: number;
  /** 보정으로 시각이 몇 분 바뀌었는지(음수는 앞당김) */
  shiftMinutes: number;
  /** 서머타임이 끝나며 같은 시각이 두 번 있는 경우 */
  ambiguous: boolean;
  /** 서머타임이 시작하며 건너뛴 시각(실제로는 없던 시각) */
  nonexistent: boolean;
};

const TZ = "Asia/Seoul";
const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** UTC 시각(ms)에서 서울 시계의 UTC 차이(분) */
function offsetAt(utcMs: number): number {
  const p = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  const local = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return Math.round((local - Math.floor(utcMs / 1000) * 1000) / 60000);
}

/** 그해 서울의 기본(서머타임이 아닌) UTC 차이: 1월 1일과 12월 31일 중 더 작은 값 */
function baseOffsetOfYear(year: number): number {
  return Math.min(offsetAt(Date.UTC(year, 0, 1, 12) - 9 * 3600000), offsetAt(Date.UTC(year, 11, 31, 12) - 9 * 3600000));
}

const CANDIDATES = [510, 540, 570, 600]; // 8:30, 9:00, 9:30, 10:00

/** 1908년 4월 이전은 표준시 제도가 없어 시계 시각을 그대로 쓴다. */
const FIRST_SUPPORTED = Date.UTC(1908, 3, 1);

export function correctClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  mode: ClockMode = "dst-only",
): ClockResult {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const same: ClockResult = { year, month, day, hour, minute, dst: false, offsetMinutes: 540, shiftMinutes: 0, ambiguous: false, nonexistent: false };
  if (wall < FIRST_SUPPORTED) return same;

  // 그 시계 시각이 가능한 UTC 차이를 찾는다.
  const valid = CANDIDATES.filter((o) => offsetAt(wall - o * 60000) === o);
  let offset: number;
  let ambiguous = false;
  let nonexistent = false;
  if (valid.length === 1) {
    offset = valid[0];
  } else if (valid.length > 1) {
    offset = Math.max(...valid); // 같은 시각이 두 번이면 먼저 온 쪽(서머타임)으로 본다
    ambiguous = true;
  } else {
    // 서머타임이 시작하며 건너뛴 시각: 시작 전 시계(표준시)로 읽는다
    offset = Math.min(offsetAt(wall - 540 * 60000), offsetAt(wall - 600 * 60000), offsetAt(wall - 570 * 60000), offsetAt(wall - 510 * 60000));
    nonexistent = true;
  }

  const base = baseOffsetOfYear(year);
  const dst = offset - base === 60;
  const standard = dst ? offset - 60 : offset; // 서머타임을 뺀 시계의 UTC 차이
  let shift = dst ? -60 : 0;
  if (mode === "utc9") shift += 540 - standard;

  const d = new Date(wall + shift * 60000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    dst,
    offsetMinutes: offset,
    shiftMinutes: shift,
    ambiguous,
    nonexistent,
  };
}
