"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ReelAnimation } from "./reel-animation";
import { WaitlistModal } from "./waitlist-modal";

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animatedStats, setAnimatedStats] = useState([false, false, false]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const delays = [600, 800, 1000];
    delays.forEach((delay, idx) => {
      setTimeout(() => {
        setAnimatedStats((prev) => {
          const newState = [...prev];
          newState[idx] = true;
          return newState;
        });
      }, delay);
    });
  }, [isVisible]);

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden pt-24">
      {/* Hero Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/media/videos/hero.mp4" type="video/mp4" />
        <source src="/media/videos/hero.mov" type="video/quicktime" />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-gray-900/80" />

      {/* Red glow effect */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-600 rounded-full opacity-10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-600 rounded-full opacity-10 blur-3xl" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 text-center">
        {/* Main headline with reel animation */}
        <h1 
          className={`text-6xl lg:text-8xl font-bold text-white mb-6 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <ReelAnimation />
        </h1>
        
        {/* Subheading */}
        <p 
          className={`text-2xl lg:text-3xl text-gray-300 mb-8 max-w-3xl mx-auto transition-all duration-1000 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          The fastest prediction terminal for BTC, ETH, and SOL. Built for the Nigerian market.
        </p>
        
        {/* CTA Button */}
        <div
          className={`transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
            className="px-10 py-6 bg-red-600 text-white text-xl font-bold rounded hover:bg-red-500 transition-colors shadow-lg"
          >
            Start Trading
          </Button>
        </div>

        {/* Animated stats with wipe effect */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stat 1: Time predictions */}
          <div
            className={`p-6 border border-red-900/30 rounded overflow-hidden relative transition-all duration-700 ${
              animatedStats[0] ? "opacity-100" : "opacity-0"
            }`}
            style={{
              clipPath: animatedStats[0] ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
              transition: "clip-path 0.8s ease-out",
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 text-red-600 flex-shrink-0 mt-2 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="9"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div className="text-left">
                <div className="text-red-600 text-3xl font-bold mb-2">
                  <ReelAnimation texts={["15 min", "5 min", "3 hrs"]} rotateInterval={2500} />
                </div>
                <div className="text-gray-400">Crypto Price Predictions</div>
              </div>
            </div>
          </div>

          {/* Stat 2: Instant */}
          <div
            className={`p-6 border border-red-900/30 rounded overflow-hidden relative transition-all duration-700 ${
              animatedStats[1] ? "opacity-100" : "opacity-0"
            }`}
            style={{
              clipPath: animatedStats[1] ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
              transition: "clip-path 0.8s ease-out",
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 text-red-600 flex-shrink-0 mt-2 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><line x1="13" y1="2" x2="13" y2="22"></line><polyline points="18 5 13 12 18 19"></polyline><polyline points="6 5 11 12 6 19"></polyline></svg>
              </div>
              <div className="text-left">
                <div className="text-red-600 text-3xl font-bold mb-2">
                  <ReelAnimation text="Instant" />
                </div>
                <div className="text-gray-400">Payouts to NGN or Crypto</div>
              </div>
            </div>
          </div>

          {/* Stat 3: Zero */}
          <div
            className={`p-6 border border-red-900/30 rounded overflow-hidden relative transition-all duration-700 ${
              animatedStats[2] ? "opacity-100" : "opacity-0"
            }`}
            style={{
              clipPath: animatedStats[2] ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
              transition: "clip-path 0.8s ease-out",
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 text-red-600 flex-shrink-0 mt-2 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <div className="text-left">
                <div className="text-red-600 text-3xl font-bold mb-2">
                  <ReelAnimation text="Zero" />
                </div>
                <div className="text-gray-400">Hidden Fees • Full Transparency</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
