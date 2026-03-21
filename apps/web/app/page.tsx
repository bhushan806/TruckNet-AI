import { HeroSection } from "@/components/landing/HeroSection";
import { StatsRibbon } from "@/components/landing/StatsRibbon";
import { FeatureGrid } from "@/components/landing/FeatureGrid";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-blue-500/30">
      <HeroSection />
      <StatsRibbon />
      <FeatureGrid />
    </div>
  );
}
