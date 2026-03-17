import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { VantVsSection } from "@/components/landing/vant-vs-section";
import { FooterSection } from "@/components/landing/footer-section";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black">
      <Navigation />
      <HeroSection />
      <HowItWorksSection />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-red-900/50 to-transparent" />
      <VantVsSection />
      <FooterSection />
    </main>
  );
}
