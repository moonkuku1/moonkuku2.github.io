import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as eventPost } from "../../app/api/event/route";
import { POST as cardPost } from "../../app/api/share/card/route";
import { filledBusinessInfo } from "../business-info";
import { chartHash } from "../cache";
import { EVENT_NAMES, EventBody } from "../events";
import { LEGAL_DOCS, legalDoc } from "../legal";
import { calculateChart } from "../saju/chart";

const INPUT = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male" } as const;
const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
  vi.restoreAllMocks();
});

describe("이용 흐름 기록 (개인정보 없음)", () => {
  const ok = { name: "cart_add", sid: "abc123xyz789", path: "/", props: { questionId: "L04", source: "rec" } };
  it("허용한 값만 받는다", () => {
    expect(EventBody.safeParse(ok).success).toBe(true);
    expect(EventBody.safeParse({ name: "home_view", sid: "abc123xyz789" }).success).toBe(true);
    expect(EVENT_NAMES).toContain("card_created");
  });
  it("생년월일·이름·임의 글자가 들어 있으면 거절한다", () => {
    expect(EventBody.safeParse({ ...ok, props: { ...ok.props, birth: "2000-01-01" } }).success).toBe(false);
    expect(EventBody.safeParse({ ...ok, birthDate: "2000-01-01" }).success).toBe(false);
    expect(EventBody.safeParse({ ...ok, name: "other_event" }).success).toBe(false);
    expect(EventBody.safeParse({ ...ok, props: { questionId: "생년월일" } }).success).toBe(false);
    expect(EventBody.safeParse({ ...ok, path: "/r/2000-01-01?birth=1" }).success).toBe(false);
    expect(EventBody.safeParse({ ...ok, sid: "short" }).success).toBe(false);
  });
  it("API: 정상이면 204로 로그 한 줄, 이상하면 400. IP는 로그에 없다", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const req = (b: unknown) => new Request("http://localhost/api/event", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "5.5.5.5" }, body: typeof b === "string" ? b : JSON.stringify(b) });
    const res = await eventPost(req(ok));
    expect(res.status).toBe(204);
    expect(log).toHaveBeenCalledTimes(1);
    const line = String(log.mock.calls[0].join(" "));
    expect(line).toContain("[event]");
    expect(line).toContain("cart_add");
    expect(line).not.toContain("5.5.5.5");
    expect((await eventPost(req({ ...ok, props: { birth: "x" } }))).status).toBe(400);
    expect((await eventPost(req("not json"))).status).toBe(400);
  });
});

describe("공유 이미지(내 사주 카드)", () => {
  const call = (b: unknown, ip: string) =>
    cardPost(new Request("http://localhost/api/share/card", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify(b) }));

  it("1080×1920 PNG를 돌려주고 생년월일은 담기지 않는다", async () => {
    delete process.env.LLM_API_KEY;
    const res = await call(INPUT, "6.6.6.1");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const buf = new Uint8Array(await res.arrayBuffer());
    expect([...buf.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(buf.buffer);
    expect(view.getUint32(16)).toBe(1080);
    expect(view.getUint32(20)).toBe(1920);
    expect(buf.length).toBeGreaterThan(50_000);
  }, 60000);
  it("시간을 모르면 3칸(시주 없음)으로도 만들어진다", async () => {
    delete process.env.LLM_API_KEY;
    const res = await call({ ...INPUT, hour: null }, "6.6.6.2");
    expect(res.status).toBe(200);
  }, 60000);
  it("없는 날짜·잘못된 입력은 400", async () => {
    delete process.env.LLM_API_KEY;
    expect((await call({ ...INPUT, month: 2, day: 30 }, "6.6.6.3")).status).toBe(400);
    expect((await call({ ...INPUT, gender: "x" }, "6.6.6.4")).status).toBe(400);
  });
  it("자주 부르면 429 (분당 10번)", async () => {
    delete process.env.LLM_API_KEY;
    let last = 200;
    for (let i = 0; i < 12; i++) last = (await call({ ...INPUT, month: 2, day: 30 }, "6.6.6.9")).status;
    expect(last).toBe(429);
  });
});

describe("약관·개인정보·환불 문서", () => {
  it("세 문서가 있고 각각 내용이 있다", () => {
    expect(LEGAL_DOCS.map((d) => d.slug).sort()).toEqual(["privacy", "refund", "terms"]);
    for (const d of LEGAL_DOCS) {
      expect(d.sections.length).toBeGreaterThanOrEqual(4);
      expect(legalDoc(d.slug)).toBe(d);
    }
    expect(legalDoc("nothing")).toBeUndefined();
  });
  const text = (slug: string) => JSON.stringify(legalDoc(slug));
  it("개인정보 안내가 실제 동작과 맞는다: 생년월일 미저장, AI 연결 전, 쿠키 없음, 14세 미만, 해외 호스팅", () => {
    const t = text("privacy");
    for (const w of ["서버에 저장하지 않아요", "AI 문장 생성", "아직 연결 전", "추적 쿠키를 쓰지 않아요", "만 14세 미만", "Vercel", "주소(URL)에는 생년월일을 넣지 않아요", "탭을 닫으면"]) expect(t, w).toContain(w);
  });
  it("환불정책에 기준 문서의 고지와 성인 확인이 있다 (요구사항 6.4, 6.5, 6.8)", () => {
    const t = text("refund");
    for (const w of ["결과 생성이 시작되면 환불이 제한돼요", "만 19세 이상", "서비스 오류로 풀이가 만들어지지 않았을 때", "아직 결제가 열리지 않았어요"]) expect(t, w).toContain(w);
  });
  it("약관에 가격 표기와 충전식 없음, 참고용 면책이 있다", () => {
    const t = text("terms");
    for (const w of ["300원", "두 사람 500원", "충전식 포인트는 없어요", "의료·법률·투자 판단을 대신하지 않아요"]) expect(t, w).toContain(w);
  });
  it("금지 표현이 없다: 가짜 후기·누적 수·BEST, 그리고 ‘돈’", () => {
    const all = LEGAL_DOCS.map((d) => JSON.stringify(d)).join("");
    for (const w of ["BEST", "후기", "평점", "누적", "100만"]) expect(all, w).not.toContain(w);
    expect(all).not.toMatch(/돈(이|을|은|도)/);
  });
  it("사업자 정보는 채워진 칸만 보인다 (지어내지 않는다)", () => {
    expect(filledBusinessInfo({ companyName: "", ceo: "", email: "" })).toEqual([]);
    expect(filledBusinessInfo({ companyName: "사주300", ceo: " ", email: "a@b.kr" })).toEqual([["상호", "사주300"], ["문의 이메일", "a@b.kr"]]);
  });
});

describe("캐시 키에 비밀 값을 섞는다", () => {
  it("같은 사주는 같은 키, 비밀 값이 다르면 다른 키 (날짜를 대입해서 알아낼 수 없다)", () => {
    const chart = calculateChart(INPUT);
    process.env.CACHE_HASH_SECRET = "secret-A";
    const a = chartHash(chart);
    expect(chartHash(calculateChart({ ...INPUT }))).toBe(a);
    process.env.CACHE_HASH_SECRET = "secret-B";
    expect(chartHash(chart)).not.toBe(a);
    // 비밀 값 없이 그냥 해시한 값과도 같지 않다
    const { createHash } = require("node:crypto") as typeof import("node:crypto");
    const plain = createHash("sha256").update(JSON.stringify({ p: [chart.pillars.year.index, chart.pillars.month.index, chart.pillars.day.index, chart.pillars.hour!.index], g: "male", s: chart.solarDate, c: [0, 30], l: false })).digest("hex").slice(0, 32);
    expect(chartHash(chart)).not.toBe(plain);
  });
  it("비밀 값을 정하지 않아도 한 서버 안에서는 일정하다", () => {
    delete process.env.CACHE_HASH_SECRET;
    const chart = calculateChart(INPUT);
    expect(chartHash(chart)).toBe(chartHash(chart));
  });
});
