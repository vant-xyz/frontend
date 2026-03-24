"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReelAnimation } from "./reel-animation";

const steps = [
  {
    number: "1",
    title: "Naira-First Funding",
    description: "Deposit via Bank Transfer or Crypto (SOL/BASE). Your balance is displayed in NGN for zero-friction trading.",
    icon: "wallet",
  },
  {
    number: "2",
    title: "Pick Your Market",
    description: "Choose between 1-minute Crypto price predictions, Sports, or P2P wagers.",
    icon: "trending",
  },
  {
    number: "3",
    title: "Stake & Vantic",
    description: "Place your prediction. Low fees, high speed, and absolute transparency on Solana.",
    icon: "zap",
  },
  {
    number: "4",
    title: "Instant Payouts",
    description: "Win and withdraw immediately back to your Nigerian bank account or crypto wallet.",
    icon: "send",
  },
];

export function HowItWorksSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
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

  // Sequential animation loop
  useEffect(() => {
    if (!isVisible) return;

    const sequence = () => {
      steps.forEach((_, idx) => {
        setTimeout(() => {
          setActiveIndex(idx);
        }, idx * 500);
      });

      setTimeout(() => {
        sequence();
      }, steps.length * 500 + 2000);
    };

    sequence();
  }, [isVisible]);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-black overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-20 text-center">
          <h2
            className={`text-5xl lg:text-6xl font-bold text-white mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <ReelAnimation text="How It Works" />
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Four simple steps to start trading predictions on the fastest terminal in West Africa
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeIndex === index;

            const renderIcon = () => {
              const iconProps = "w-12 h-12 text-red-600 transition-all duration-500";
              switch (step.icon) {
                case "wallet":
                  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${iconProps} ${isActive ? "scale-125" : "scale-100"}`}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><path d="M1 10h22"></path></svg>;
                case "trending":
                  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${iconProps} ${isActive ? "scale-125" : "scale-100"}`}><polyline points="23 6 13.5 15.5 8.5 10.5 1 17"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
                case "zap":
                  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${iconProps} ${isActive ? "scale-125" : "scale-100"}`}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
                case "send":
                  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${iconProps} ${isActive ? "scale-125" : "scale-100"}`}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
                default:
                  return null;
              }
            };

            const renderBackgroundIcon = () => {
              const bgIconProps = "w-32 h-32 text-red-600";
              switch (step.icon) {
                case "wallet":
                  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={bgIconProps}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><path d="M1 10h22"></path></svg>;
                case "trending":
                  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={bgIconProps}><polyline points="23 6 13.5 15.5 8.5 10.5 1 17"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
                case "zap":
                  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={bgIconProps}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
                case "send":
                  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={bgIconProps}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
                default:
                  return null;
              }
            };

            return (
              <Card
                key={step.number}
                className={`group relative p-8 bg-black border-2 rounded-lg overflow-hidden transition-all duration-500 ${
                  isActive
                    ? "border-red-600 scale-105"
                    : "border-red-900/30"
                } ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
                  transform: isActive ? "perspective(1000px) rotateX(5deg) rotateY(-5deg)" : "perspective(1000px) rotateX(0deg) rotateY(0deg)",
                }}
              >
                {/* Vertex Brackets */}
                <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-red-600" />
                <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-red-600" />
                <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-red-600" />
                <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-red-600" />

                {/* Icon Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 transition-all duration-500">
                  {renderBackgroundIcon()}
                </div>

                {/* Content */}
                <CardContent className="relative z-10 p-0">
                  {/* Icon */}
                  <div className="mb-6 transition-all duration-500">
                    {renderIcon()}
                  </div>

                  {/* Title with animation */}
                  <h3 className={`text-2xl font-bold text-white mb-4 transition-all duration-500 ${
                    isActive ? "translate-x-2" : "translate-x-0"
                  }`}>
                    <ReelAnimation text={step.title} />
                  </h3>

                  {/* Description */}
                  <p className={`text-gray-400 leading-relaxed transition-all duration-500 ${
                    isActive ? "text-gray-300" : "text-gray-500"
                  }`}>
                    {step.description}
                  </p>
                </CardContent>

                {/* Connector */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-px bg-gradient-to-r from-red-600 to-transparent opacity-30" />
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
