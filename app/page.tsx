import { Hero } from "@/widgets/hero/hero";
import { SeaLevelScene } from "@/widgets/story/sea-level-scene";
import { CoastlineScene } from "@/widgets/story/coastline-scene";
import { PollutionSection, LifeSection, AiSummarySection } from "@/widgets/story/threat-sections";
import { AcademyCta } from "@/widgets/academy/academy-cta";
import { SiteFooter } from "@/widgets/site-footer/site-footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <SeaLevelScene />
      <CoastlineScene />
      <PollutionSection />
      <LifeSection />
      <AiSummarySection />
      <AcademyCta />
      <SiteFooter />
    </main>
  );
}
