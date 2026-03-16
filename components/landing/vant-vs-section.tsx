"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        <div className="mb-20">
          <h2
            className={`text-5xl lg:text-6xl font-bold text-white mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Vant <span className="text-red-600">VS</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl">
            The Wager Engine. Set a custom event (COD matches, gaming, etc.), stake against a friend, and the winner takes all. Decentralized escrow for total peace of mind.
          </p>
        </div>

        {/* Feature Card */}
        <Card
          className={`relative p-12 lg:p-16 bg-gradient-to-br from-red-900/20 to-black border border-red-600/50 rounded-xl overflow-visible transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Vertex Brackets */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-red-600" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-red-600" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-red-600" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-red-600" />

          {/* Accent glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600 rounded-full opacity-5 blur-3xl" />

          <CardContent className="relative z-10 p-0">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left content */}
              <div>
                <Badge className="px-4 py-2 bg-red-600/20 border border-red-600/50 rounded-full mb-6 text-red-400 font-semibold">
                  PEER-TO-PEER WAGERING
                </Badge>

                <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                  Wager on Anything
                </h3>

                <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                  Create custom markets instantly. Whether it's COD tournament outcomes, gaming tournaments, esports matches, or any event you want to predict on—Vant VS has you covered.
                </p>

                {/* Features list */}
                <div className="space-y-4">
                  {[
                    "Instant match creation",
                    "Decentralized escrow protection",
                    "Smart contract settlements",
                    "Zero platform interference",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side - Visual */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  {/* Player 1 */}
                  <Card className="p-6 bg-black/50 border border-red-600/30 rounded-lg text-center">
                    <CardContent className="p-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-600/40 to-red-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl font-bold text-red-500">P1</span>
                      </div>
                      <p className="text-white font-semibold mb-3">Your Stake</p>
                      <p className="text-red-500 text-2xl font-bold">10,000 NGN</p>
                    </CardContent>
                  </Card>

                  {/* VS */}
                  <div className="flex items-center justify-center py-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-600 rounded-full opacity-20 blur-xl" />
                      <span className="relative text-white font-bold text-3xl">VS</span>
                    </div>
                  </div>

                  {/* Outcome */}
                  <Card className="col-span-2 p-6 bg-black/50 border border-green-600/30 rounded-lg text-center">
                    <CardContent className="p-0">
                      <p className="text-gray-400 text-sm mb-2">POTENTIAL WINNINGS</p>
                      <p className="text-green-400 text-3xl font-bold">19,500 NGN</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div
          className={`mt-12 text-center transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button className="px-8 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-500 transition-colors">
            Create Your First Wager
          </Button>
        </div>
      </div>
    </section>
  );
}
