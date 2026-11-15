import type { EventBody, EventName } from "./events";

/**
 * 브라우저에서 이용 흐름을 알린다(개인정보 없음, lib/events.ts 참고).
 * "추적 금지(Do Not Track)"를 켠 브라우저에서는 아무것도 보내지 않는다. 실패해도 화면은 멈추지 않는다.
 */
const SID_KEY = "saju300-sid";

function sessionId(): string {
  let sid = sessionStorage.getItem(SID_KEY);
  if (!sid) {
    sid = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
    sessionStorage.setItem(SID_KEY, sid);
  }
  return sid;
}

export function track(name: EventName, props?: EventBody["props"]): void {
  try {
    if (typeof window === "undefined") return;
    if (navigator.doNotTrack === "1") return;
    const body = JSON.stringify({ name, sid: sessionId(), path: location.pathname, props });
    if (navigator.sendBeacon?.("/api/event", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/event", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
  } catch {
    /* 기록이 실패해도 서비스는 그대로 */
  }
}
