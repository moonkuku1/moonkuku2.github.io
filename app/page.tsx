import { Banners } from "@/components/home/banners";
import { Categories } from "@/components/home/categories";
import { Situations } from "@/components/home/situations";
import { Today } from "@/components/home/today";
import { FreeCard, Footer, Guides, Promises, SampleAnswer } from "@/components/home/rest";
import { BottomBar, Header } from "@/components/chrome";
import { ScrollMemory } from "@/components/scroll-memory";
import { SideRails } from "@/components/side-rails";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Banners />
        <Today />
        <Situations />
        <Categories />
        <Guides />
        <SampleAnswer />
        <FreeCard />
        <Promises />
      </main>
      <Footer />
      <BottomBar current="home" />
      <SideRails />
      <ScrollMemory />
    </>
  );
}
