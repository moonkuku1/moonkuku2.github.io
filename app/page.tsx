import { Hero } from "@/components/home/hero";
import { Footer, Guides, Promises, SampleAnswer } from "@/components/home/rest";
import { Topics } from "@/components/home/topics";
import { BottomBar, Header } from "@/components/chrome";
import { ScrollMemory } from "@/components/scroll-memory";

/**
 * 홈 구성(위에서 아래): 내 사주(생년월일 입력 → 무료 카드) → 궁금한 주제 고르기 → 답변 예시 → 풀이꾼 → 약속.
 * 첫 화면의 할 일은 생년월일 입력 하나다. 오늘 한 마디·일주 카드·추천 질문은 입력 뒤 같은 자리에서 나온다.
 */
export default function HomePage() {
  return (
    <div className="app-shell app-shell-wide">
      <Header />
      <main>
        <Hero />
        <Topics />
        <SampleAnswer />
        <Guides />
        <Promises />
      </main>
      <Footer />
      <BottomBar current="home" />
      <ScrollMemory />
    </div>
  );
}
