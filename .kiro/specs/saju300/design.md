# 사주300 설계 (design.md) — 화면 디자인 부분

이 문서는 화면 쪽 설계만 다룬다. 계산·판정·AI·결제 설계는 해당 단계를 시작할 때 이어서 쓴다.
기준: `docs/design-guide.md`, `.kiro/steering/design.md`, requirements 4.1~4.5, 4.10, 8.3, 9.

## 디자인 토큰
- `app/globals.css`의 `@theme`에 색·글꼴·모서리 값을 한 번만 정의한다. (Tailwind v4는 `tailwind.config`의 `theme.extend` 대신 CSS `@theme`을 쓴다.)
- 화면 코드는 `bg-night`, `text-gold`, `bg-cta`, `rounded-card` 같은 토큰 이름만 쓴다. 오행 색은 결과 화면 명식표에서만 쓴다.
- 글꼴은 `next/font/google`로 불러온다: Song Myung(`font-display`), Noto Serif KR(`font-serif`), Noto Sans KR(`font-sans`).
- 공통 CSS 클래스: `.app-shell`(최대 480px 가운데), `.hanji`(한지 카드 + 안쪽 금선), `.press`(44px 이상, 누르면 0.98배), `.stamp-anim`(도장 찍히기, 유일한 움직임, `prefers-reduced-motion`에서 꺼짐).

## 데이터
| 파일 | 내용 |
|---|---|
| `data/questions.json` | 질문 (기존) |
| `data/categories.json` | 카테고리 코드 → 표시 이름, 포스터·소재 그림 이름, 담당 풀이꾼, 한 줄 소개 |
| `data/situations.json` | 홈 ‘이럴 땐 이 질문’ 카드 5장과 질문 ID 3개씩 |
| `lib/questions.ts` | 위 데이터 로더, ID 중복·필수 칸 검사, draft 표시 설정(`NEXT_PUBLIC_SHOW_DRAFT`) |
| `lib/result.ts` | 판정 결과 모양(`Verdict`)과 샘플 결과. 판정 엔진이 붙으면 `getVerdict`만 바꾼다. |

풀이꾼은 `categories.json`의 `guide` 값 한 곳에서만 정한다(요구사항 4.4-1).

## 화면과 파일
| 화면 | 경로 | 파일 |
|---|---|---|
| 모바일 홈 | `/` | `app/page.tsx`, `components/chrome.tsx`(헤더·탭·아래 메뉴·담은 질문 줄), `components/home/*` |
| 결과 | `/r/[orderId]` | `app/r/[orderId]/page.tsx`, `components/result/*` |
| 공유 카드 | `/api/share/story`, `/api/share/og` | `app/api/share/[kind]/route.tsx`, `lib/share-fonts.ts` |

- 장바구니 상태는 `components/cart.tsx`의 `CartProvider`(브라우저 localStorage)가 맡는다. 담기 버튼(`AddButton`)은 `aria-pressed`로 상태를 알린다.
- 결과 화면은 `Verdict` 값만 읽는다. 판정·확신도·시기는 화면에서 계산하지 않는다.
- 공유 이미지는 서버에서 `next/og`로 만들고, 주문 번호로 결과를 읽는다. 생년월일은 이미지에도 주소에도 넣지 않는다. 한글 글꼴은 이미지에 쓸 글자만 Google Fonts에서 받아 온다.
- 결과 페이지의 링크 미리보기(OG) 이미지는 `generateMetadata`가 `/api/share/og`로 연결한다.

## 이후 작업과의 연결
- 카테고리 질문 목록(`/c/[code]`), 장바구니 페이지(`/cart`)는 지금 홈의 포스터 펼침과 아래 결제 줄이 대신한다. 해당 단계에서 만든다.
- 홈의 ‘오늘 한 마디’는 샘플 문장 모드다. 판정 엔진이 붙으면 같은 입력칸에 연결한다.
