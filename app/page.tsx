import { Banners } from "@/components/home/banners";
import { Categories } from "@/components/home/categories";
import { Situations } from "@/components/home/situations";
import { Today } from "@/components/home/today";
import { FreeCard, Footer, Guides, Promises, SampleAnswer } from "@/components/home/rest";
import { BottomBar, Header } from "@/components/chrome";
import { ScrollMemory } from "@/components/scroll-memory";

export default function HomePage() {
  return (
    <div className="app-shell app-shell-wide">
      <Header />
      <main>
        <Banners />
        {/* PC에서는 오늘 한 마디와 답변 예시를 나란히 놓는다 */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-4">
          <Today />
          <SampleAnswer />
        </div>
        <Situations />
        <Categories />
        <Guides />
        <FreeCard />
        <Promises />
      </main>
      <Footer />
      <BottomBar current="home" />
      <ScrollMemory />
    </div>
  );
}
