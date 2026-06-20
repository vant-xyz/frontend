"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GlowButton } from "@/components/ui/glow-button";

export function HeroSection() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0a0404]">
      {/* Red ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] rounded-full bg-red-800/10 blur-[140px] pointer-events-none" />

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto pt-36 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Badge pill — black background */}
        <div className="inline-flex items-center gap-2 mb-10 px-3 py-1.5 rounded-[10px] bg-black border border-white/10 text-sm">
          <span className="text-zinc-400 text-xs font-medium">CA Coming Soon</span>
          <span className="w-px h-3.5 bg-white/10" />
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[8px] bg-zinc-900 border border-white/10 text-xs text-zinc-300 font-medium">
            <Image
              src="/media/images/token_icons/solana.png"
              alt="Solana"
              width={14}
              height={14}
              className="shrink-0 rounded-full"
            />
            Solana
          </span>
        </div>

        {/* Headline — metallic shimmer */}
        <h1 className="text-5xl sm:text-6xl lg:text-[5rem] font-bold leading-[1.06] tracking-tight mb-6">
          <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="shimmer-metallic">Predict</span>
            <span className="shimmer-metallic">the</span>
            <span className="inline-flex items-center gap-2">
              <Image
                src="/icons8-globe-96.png"
                alt=""
                width={64}
                height={64}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 inline-block"
              />
              <span className="shimmer-metallic">World.</span>
            </span>
          </span>
          <br />
          <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="shimmer-metallic">Win in</span>
            <span className="inline-flex items-center gap-2">
              <Image
                src="/icons8-realtime-96.png"
                alt=""
                width={64}
                height={64}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 inline-block"
              />
              <span className="shimmer-metallic">Real Time.</span>
            </span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-zinc-500 max-w-lg mx-auto mb-10 leading-relaxed">
          Trade yes/no outcomes on World Cup matches, crypto, and politics.
          Non-custodial. Settled on-chain.
        </p>

        {/* CTAs — squircle buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <GlowButton onClick={() => router.push("/app")}>
            Launch App
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
          </GlowButton>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-7 py-3.5 rounded-[12px] border border-white/10 bg-white/[0.03] backdrop-blur-sm text-zinc-400 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200"
          >
            How it Works
          </a>
        </div>
      </div>

      {/* App screenshot — perspective tilt */}
      <div
        className={`relative z-10 w-full max-w-5xl mx-auto px-6 mt-20 transition-all duration-1000 delay-300 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
        style={{ perspective: "1200px" }}
      >
        <div
          style={{ transform: "rotateX(18deg) scale(1.02)", transformOrigin: "top center" }}
          className="relative rounded-[14px] overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/80"
        >
          <Image
            src="/public-hero-image.png"
            alt="Vantic app"
            width={1440}
            height={900}
            className="w-full h-auto"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent to-[#0a0404]" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0404] to-transparent pointer-events-none" />
    </section>
  );
}
