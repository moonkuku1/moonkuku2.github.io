# Tech

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: 로그인, DB (사주 정보, 사주 프로필, 답변 캐시, 주문, 보관함, 알림)
- 포트원: 결제 연동 (실제 결제사는 사주·운세 업종 승인된 곳). 개발 중에는 테스트 모드
- LLM API: 서버(Route Handler / Server Action)에서만 호출, temperature 0~0.3
- 테스트: Vitest (사주 계산·신호·판정 모듈 필수)
- 배포: GitHub 저장소를 Vercel에 연결
- 패키지 매니저: npm

## 규칙
- 비밀값은 `.env.local`에만 두고 `.env.example`에는 변수 이름만 적는다. `.env*.local`은 `.gitignore`에 포함.
- 사주 계산·신호·판정은 UI와 분리된 순수 함수 모듈로 만들고 테스트를 작성한다.
- 질문과 레시피는 `data/` 아래 JSON에서 읽는다. 질문 문구를 코드에 하드코딩하지 않는다.
- LLM 프롬프트(P1~P6)는 `docs/business-plan.md` 8장의 문구를 그대로 `lib/llm/prompts/` 아래 파일로 옮겨 쓴다.
- LLM 출력은 JSON 스키마로 검증하고, 실패 시 1회 재생성 후 운영자 알림.
- 사용자는 프로그래밍 초보자다. 작업마다 무엇을 왜 했는지 쉬운 한국어로 설명하고, 직접 확인할 방법(실행 명령, 열어볼 주소)을 알려준다.
- 새 패키지를 추가할 때는 이유를 한 줄로 설명한다.
- 기준 문서와 다르게 하는 것이 낫다고 판단되면, 바꾸기 전에 이유와 함께 먼저 묻는다.
