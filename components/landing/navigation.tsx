"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WaitlistModal } from "./waitlist-modal";

interface NavigationProps {
  onWaitlistOpen?: () => void;
}

export function Navigation({ onWaitlistOpen }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled
            ? "bg-black/80 backdrop-blur-md border-b border-red-900/30"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded"></div>
            <span className="text-2xl font-bold text-white">VANT</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#vant-vs"
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Vant VS
            </a>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-500 transition-colors"
            >
              Start Trading
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={() => setIsModalOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </nav>
      </header>

      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
