import { z } from "zod";

/**
 * 이용 흐름 기록(요구사항 10.3): 개인을 식별하지 않고 "어떤 일이 일어났는지"만 센다.
 * 생년월일·사주·풀이 내용·이름은 절대 담지 않는다. 담을 수 있는 값은 아래 목록에 있는 것뿐이고, 그 밖의 값은 서버가 거절한다.
 */
export const EVENT_NAMES = ["home_view", "card_created", "share_card", "cart_add", "cart_add_many", "cart_view", "free_sinsal"] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export const EventBody = z
  .object({
    name: z.enum(EVENT_NAMES),
    /** 탭이 열려 있는 동안만 쓰는 임의 번호(탭을 닫으면 사라짐). 한 사람의 흐름을 이어서 세기 위한 것이다. */
    sid: z.string().regex(/^[a-z0-9]{8,16}$/),
    path: z.string().regex(/^\/[A-Za-z0-9/_-]{0,40}$/).optional(),
    props: z
      .object({
        questionId: z.string().regex(/^[A-Z]\d{2}$/).optional(),
        source: z.enum(["rec", "chip", "topic", "picker", "cart", "result"]).optional(),
        n: z.number().int().min(0).max(300).optional(),
        sample: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type EventBody = z.infer<typeof EventBody>;
