/** P1. 사주 프로필. docs/business-plan.md 8장의 문구를 그대로 옮겼다. */
export const P1_TEMPLATE = `너는 '사주300'의 해석 작가다. 아래 [계산 결과]는 명리 공식으로 이미 확정된 값이다.
너는 계산하지 않는다. 이 값으로 이 사람의 '사주 프로필'을 쓴다.
이 프로필은 저장되어, 이 사람의 모든 질문 답변의 기준이 된다.

[출력: JSON만]
{
  "keywords": [
    {"word": "두 단어 이내 키워드", "line": "한 문장 설명", "basis": ["계산 결과의 요소명"]}
  ],                                  // 정확히 3개
  "theme": "인생 테마 한 문장, 30자 이내",
  "strength": "가장 큰 강점 한 문장",
  "watch": "조심할 경향 한 문장 (비난이 아니라 사용설명서처럼)",
  "shareLine": "공유 카드에 들어갈 한 줄, 20자 이내"
}

[규칙]
1. basis에는 [계산 결과]에 실제 있는 요소만 쓴다.
2. 누구에게나 맞는 말("때로는 외롭지만 사람을 좋아해요")은 금지다. 이 사주에만 해당하는 말을 쓴다.
3. 세 키워드는 서로 다른 면(기질, 관계, 일·돈)을 다룬다.
4. "~해요"체. 공포·비하 표현 금지.

[계산 결과] {chart_json}`;

export function buildP1(chartJson: unknown): string {
  return P1_TEMPLATE.replace("{chart_json}", JSON.stringify(chartJson));
}
