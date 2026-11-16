import { Hero } from "@/components/home/hero";
import { GuideTopics } from "@/components/home/guide-topics";
import { Footer, Promises, SampleAnswer } from "@/components/home/rest";
import { BottomBar, Header } from "@/components/chrome";
import { ScrollMemory } from "@/components/scroll-memory";

/**
 * 홈 구성(위에서 아래): 내 사주(생년월일 입력 → 무료 카드) → 풀이꾼과 궁금한 주제(고민 칩 + 풀이꾼 카드 안의 주제 포스터) → 답변 예시 → 약속. 휴대폰은 옆으로 넘기는 슬라이드.
 * 첫 화면의 할 일은 생년월일 입력 하나다. 오늘 한 마디·일주 카드·추천 질문은 입력 뒤 같은 자리에서 나온다.
 */
export default function HomePage() {
  return (
    <div className="app-shell app-shell-wide">
      <Header />
      <main>
        <Hero />
        <GuideTopics />
        <SampleAnswer />
        <Promises />
      </main>
      <Footer />
      <BottomBar current="home" />
      <ScrollMemory />
    </div>
  );
}
