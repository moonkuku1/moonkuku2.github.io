import { freeHandler } from "../../../../lib/free-route";
import { makeIlgan } from "../../../../lib/free-tools";

/** 무료 일간 API (생년월일은 저장하지 않는다) */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = freeHandler("일간", makeIlgan);
