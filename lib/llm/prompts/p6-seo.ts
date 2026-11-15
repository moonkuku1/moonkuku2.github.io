/** P6. 질문 소개 페이지(검색 유입용). docs/business-plan.md 8장의 문구를 그대로 옮겼다. 결과는 사람이 검토한 뒤 공개한다. */
export const P6_TEMPLATE = `'사주300'의 질문 소개 페이지를 쓴다. 개인 사주 풀이가 아니라
"사주에서는 이 질문을 어떻게 보는가"를 설명하는 글이다.

[출력: JSON만]
{"h1": "질문 그대로", "intro": "2문장",
 "howWeRead": "이 질문에서 보는 사주 요소 3가지와 각각의 의미, 400~600자",
 "faq": [{"q": "", "a": ""}],   // 3개
 "metaDescription": "80자 이내"}

[규칙] 어떤 사람의 결과도 단정하지 않는다. 실제 이용자 수·후기·적중률을 언급하지 않는다.
마지막 문장은 "내 사주로 확인하기 (300원)"으로 끝낸다.
[질문] {question_json}  [레시피] {recipe_json}`;

export function buildP6(question: unknown, recipe: unknown): string {
  return P6_TEMPLATE.replace("{question_json}", JSON.stringify(question)).replace("{recipe_json}", JSON.stringify(recipe));
}
