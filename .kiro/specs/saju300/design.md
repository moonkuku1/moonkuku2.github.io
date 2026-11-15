# 사주300 설계 (design.md) — 화면 디자인 부분

이 문서는 화면 쪽 설계만 다룬다. 계산·판정·AI·결제 설계는 해당 단계를 시작할 때 이어서 쓴다.
기준: `docs/design-guide.md`, `.kiro/steering/design.md`, requirements 4.1~4.5, 4.10, 8.3, 9.

## 디자인 토큰
- `app/globals.css`의 `@theme`에 색·글꼴·모서리 값을 한 번만 정의한다. (Tailwind v4는 `tailwind.config`의 `theme.extend` 대신 CSS `@theme`을 쓴다.)
- 화면 코드는 `bg-night`, `text-gold`, `bg-cta`, `rounded-card` 같은 토큰 이름만 쓴다. 오행 색은 결과 화면 명식표에서만 쓴다.
- 글꼴은 `next/font/google`로 불러온다: Song Myung(`font-display`), Noto Serif KR(`font-serif`), Noto Sans KR(`font-sans`).
- 공통 CSS 클래스: `.app-shell`(최대 480px 가운데), `.hanji`(한지 카드 + 안쪽 금선), `.press`(44px 이상, 누르면 0.98배), `.stamp-anim`(도장 찍히기), `.kenburns`·`.moon-glow`·`.float`·`.lift`(잔잔한 움직임, `.motion`은 화면 밖에서 멈춤, 모두 `prefers-reduced-motion`에서 꺼짐).

## 데이터
| 파일 | 내용 |
|---|---|
| `data/questions.json` | 질문 (기존) |
| `data/categories.json` | 카테고리 코드 → 표시 이름, 포스터·소재 그림 이름, 담당 풀이꾼, 한 줄 소개 |
| `data/situations.json` | 홈 ‘요즘 이런 고민 있어요’ 카드 5장(제목·한 줄 설명·질문 ID 3개) |
| `data/pricing.json` | 주제 묶음가(기본 7,900원, 궁합 12,900원), 최소 결제 금액. 묶음가가 정가 이상이면 빌드 오류 (`lib/pricing.ts`) |
| `data/guides.json` | 풀이꾼 3명의 이름·담당 범위·역할 한 줄·말투·담당 카테고리·대표 대사 |
| `lib/questions.ts` | 위 데이터 로더, ID 중복·필수 칸 검사, draft 표시 설정(`NEXT_PUBLIC_SHOW_DRAFT`) |
| `lib/result.ts` | 판정 결과 모양(`Verdict`)과 샘플 결과. 판정 엔진이 붙으면 `getVerdict`만 바꾼다. |

풀이꾼은 `categories.json`의 `guide` 값 한 곳에서만 정한다(요구사항 4.4-1).

## 화면과 파일
| 화면 | 경로 | 파일 |
|---|---|---|
| 모바일 홈 | `/` | `app/page.tsx`, `components/chrome.tsx`(헤더·탭·아래 메뉴·담은 질문 줄), `components/home/*` |
| 주제 페이지 | `/c/[code]` | `app/c/[code]/page.tsx`, `components/picker.tsx`(전체 선택/해제·필터·고정 요약) |
| 장바구니 | `/cart` | `app/cart/page.tsx`, `components/cart-view.tsx`(주제별 요약·펼침·결제 전 확인) |
| 결과 | `/r/[orderId]` | `app/r/[orderId]/page.tsx`, `components/result/*` |
| 공유 카드 | `/api/share/story`, `/api/share/og` | `app/api/share/[kind]/route.tsx`, `lib/share-fonts.ts` |

- 장바구니 상태는 `components/cart.tsx`의 `CartProvider`(브라우저 localStorage)가 맡는다. 담기 버튼(`AddButton`)은 `aria-pressed`로 상태를 알린다.
- 결과 화면은 `Verdict` 값만 읽는다. 판정·확신도·시기는 화면에서 계산하지 않는다.
- 공유 이미지는 서버에서 `next/og`로 만들고, 주문 번호로 결과를 읽는다. 생년월일은 이미지에도 주소에도 넣지 않는다. 한글 글꼴은 이미지에 쓸 글자만 Google Fonts에서 받아 온다.
- 결과 페이지의 링크 미리보기(OG) 이미지는 `generateMetadata`가 `/api/share/og`로 연결한다.

## 판정 엔진 구조 (요구사항 1~2장)
```
입력(생년월일시·성별) → lib/saju/chart.ts  calculateChart()      만세력·분석(오행·십성·합충·신살·대운·신강신약·격국·도움이 되는 오행)
질문 ID + 기준 연월    → lib/verdict/recipes.ts resolveRecipe()    질문별 레시피, 없으면 카테고리 공통 레시피
                      → lib/signals/context.ts buildContext()     (명식, 세운 연도, 월운 번호)로 신호 계산에 쓸 값 준비
                      → lib/signals/library.ts SIGNALS            신호 60개(순수 함수)
                      → lib/verdict/engine.ts  judge()            판정·확신도·시기·근거 신호·반대 신호·안전 표시
```
- 판정 값(`Verdict`)은 AI 문장 생성(P2)의 입력이 된다. AI는 이 값을 바꾸지 못한다.
- 가중치와 신호는 데이터(`data/recipes.json`, `data/recipe-defaults.json`)에 있고, 틀린 데이터는 바로 오류로 알린다.
- 확신도: (지지 신호 합 − 반대 신호 합) 5 이상 강, 2~4 중, 1 이하 약. 출생 시간을 모르거나 1~3위 점수 차가 1 이하면 한 단계 낮춘다.
- 기준 연월의 세운은 입춘 기준으로 정한다(예: 2027년 1월은 2026년 세운).

## 이후 작업과의 연결
- 결과 화면의 샘플 문장은 `lib/result.ts`의 `SAMPLES`(풀이꾼별 말투 3종)다. 판정 엔진·P2가 붙으면 같은 `voice` 값을 프롬프트에 넣는다.
- 결제는 아직 연결 전이다. `/cart`의 결제 버튼은 안내만 보여 준다.
- 홈의 ‘오늘 한 마디’는 샘플 문장 모드다. 판정 엔진이 붙으면 같은 입력칸에 연결한다.

