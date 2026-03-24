"use client";

import { useEffect, useRef, useState } from "react";
import { ReelAnimation } from "./reel-animation";

export function VantVsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="vant-vs"
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-black overflow-hidden"
    >
      {/* Red glow effects */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-red-600 rounded-full opacity-10 blur-3xl" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-red-600 rounded-full opacity-10 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-16">
          <h2
            className={`text-5xl lg:text-6xl font-bold text-white mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <ReelAnimation text="Vantic VS" />
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl">
            The Wager Engine. Set a custom event (COD matches, gaming, etc.), stake against a friend, and the winner takes all.
          </p>
        </div>

        {/* Content */}
        <div
          className={`transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            <ReelAnimation text="Wager on Anything" />
          </h3>

          <p className="text-lg text-gray-300 leading-relaxed max-w-3xl">
            Create custom markets instantly. Whether it's gaming tournaments, events outcomes, 
            duels, or any event you want to predict on, VS has you covered.
          </p>
        </div>

        {/* CTA */}
        <div
          className={`mt-12 text-center transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <button className="px-8 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-500 transition-colors">
            Create Your First Wager
          </button>
        </div>
      </div>
    </section>
  );
}
