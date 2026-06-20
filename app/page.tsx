import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FooterSection } from "@/components/landing/footer-section";
import { LenisProvider } from "@/components/landing/lenis-provider";

export default function Home() {
  return (
    <>
      <LenisProvider />
      {/* Animated film-grain overlay */}
      <div className="grain" aria-hidden="true" />
      {/* overflow-x-clip (NOT hidden) so position:sticky children still pin */}
      <main className="relative min-h-screen overflow-x-clip bg-[#0a0404]">
        <Navigation />
        <HeroSection />
        <HowItWorksSection />
        <FooterSection />
      </main>
    </>
  );
}
