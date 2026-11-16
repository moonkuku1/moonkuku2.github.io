import { freeHandler } from "../../../../lib/free-route";
import { makeSinsal } from "../../../../lib/free-sinsal";

/** 무료 신살 API (생년월일은 저장하지 않는다) */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = freeHandler("신살", makeSinsal);
