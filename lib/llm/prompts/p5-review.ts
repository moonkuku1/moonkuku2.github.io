/**
 * P5. 답변 검수. docs/business-plan.md 8장의 문구를 그대로 옮겼다.
 * 코드 검사(매번)는 lib/llm/review.ts, AI 검사(표본 5%)는 아래 문구를 쓴다.
 */
export const P5_AI_TEMPLATE = `[AI 검수, 표본 5%만]
아래 [답변]을 [입력값]과 비교하라. JSON만 출력한다.
{"invented": [입력값에 없는 사주 요소·시기 언급],
 "barnum": [누구에게나 맞는 문장],
 "fear": [공포·단정 표현],
 "profileConflict": [프로필과 모순되는 문장],
 "pass": true 또는 false}`;

export function buildP5(answer: unknown, input: unknown): string {
  return `${P5_AI_TEMPLATE}\n\n[답변] ${JSON.stringify(answer)}\n[입력값] ${JSON.stringify(input)}`;
}
