import { freeHandler } from "../../../../lib/free-route";
import { makeOhaeng } from "../../../../lib/free-tools";

/** 무료 오행 API (생년월일은 저장하지 않는다) */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = freeHandler("오행", makeOhaeng);
