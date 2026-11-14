# Structure (권장)

```
app/
  page.tsx                  메인 (시즌 배너, 카테고리, 추천 질문, 무료 프로필 카드 입력)
  profile/page.tsx          무료 사주 프로필 카드 + 내 사주 맞춤 질문 3개 추천
  c/[code]/page.tsx         카테고리별 질문 목록
  q/[id]/page.tsx           질문 소개 페이지 (검색용, P6) + 장바구니 담기
  cart/page.tsx             장바구니 + 함께 보면 좋은 질문 + 결제 전 환불 고지 동의
  r/[orderId]/page.tsx      결과 (판정·근거 칩·확신도·반대 신호·처방)
  invite/[token]/page.tsx   궁합 초대 링크
  free/[sal]/page.tsx       무료 신살 조회
  me/page.tsx               보관함, 내 사주 정보, 알림 설정
  legal/(terms|refund|privacy)/page.tsx
  api/answer/route.ts       계산 → 캐시 확인 → 판정 → LLM → 검수 → 저장
  api/payment/webhook/route.ts  포트원 결제 검증
lib/
  saju/          만세력 계산 (calendar, pillars, analysis, relations, sinsal, luck) + __tests__
  signals/       공통 신호 라이브러리 (신호 하나 = 순수 함수 하나) + __tests__
  verdict/       레시피 → 판정·확신도·시기 계산 + __tests__
  llm/
    prompts/     p1-profile.ts, p2-answer.ts, p3-compat.ts, p4-yearly.ts, p5-review.ts, p6-seo.ts
    run.ts       프롬프트 조립, 호출, JSON 검증
    review.ts    P5 코드 검수 (근거 칩·판정 포함·금지어·길이)
  cache.ts       (명식 해시 + 질문 ID + 기준 연월) 캐시
  questions.ts   data/questions.json + data/recipes.json 로더
data/
  questions.json 질문 목록
  recipes.json   질문 레시피 (인기 60문항 정교, 나머지 카테고리 공통)
docs/
  business-plan.md  전체 기준 문서
```
