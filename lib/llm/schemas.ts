import { z } from "zod";

/** AI가 돌려주는 JSON의 모양(요구사항 3.6). 모양이 다르면 검수에서 떨어진다. */

export const ProfileSchema = z.object({
  keywords: z
    .array(
      z.object({
        word: z.string().trim().min(1).max(20),
        line: z.string().trim().min(5).max(120),
        basis: z.array(z.string().trim().min(1)).min(1).max(5),
      }),
    )
    .length(3),
  theme: z.string().trim().min(3).max(30),
  strength: z.string().trim().min(5).max(120),
  watch: z.string().trim().min(5).max(120),
  shareLine: z.string().trim().min(3).max(20),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const AnswerSchema = z.object({
  headline: z.string().trim().min(3).max(40),
  evidence: z
    .array(z.object({ chip: z.string().trim().min(1), why: z.string().trim().min(5).max(120) }))
    .max(3),
  story: z.string().trim().min(100).max(1000),
  counter: z.string().trim().max(160),
  action: z.object({ do: z.string().trim().min(5).max(120), by: z.string().trim().min(2).max(40) }),
  avoid: z.string().trim().min(3).max(120),
  confidenceNote: z.string().trim().max(160),
  /** P4(신년운세)일 때만: 12개월 한 줄 조언 */
  months: z.array(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), line: z.string().trim().min(2).max(25) })).length(12).optional(),
});
export type Answer = z.infer<typeof AnswerSchema>;

export const AiReviewSchema = z.object({
  invented: z.array(z.string()),
  barnum: z.array(z.string()),
  fear: z.array(z.string()),
  profileConflict: z.array(z.string()),
  pass: z.boolean(),
});
export type AiReview = z.infer<typeof AiReviewSchema>;

/** 모델 답에서 JSON만 꺼낸다(앞뒤 설명이나 ```json 울타리가 붙어 있어도 읽는다). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("JSON을 찾지 못했어요");
  // 프롬프트의 예시처럼 // 로 시작하는 줄 끝 주석이 섞여 나오는 경우를 지운다
  const cleaned = body
    .slice(start, end + 1)
    .split("\n")
    .map((line) => line.replace(/\s\/\/[^"\n]*$/, ""))
    .join("\n");
  return JSON.parse(cleaned);
}
