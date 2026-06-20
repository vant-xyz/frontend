"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlowButton } from "@/components/ui/glow-button";
import { AuthModal } from "./auth-modal";
import { getUserProfile, type AuthResponse } from "@/lib/api";

interface NavigationProps {
  onWaitlistOpen?: () => void;
}

export function Navigation({ onWaitlistOpen }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showTelegram, setShowTelegram] = useState(false);
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);

  useEffect(() => {
  async function initUser() {
    const token = localStorage.getItem("auth_token_temp");
    const storedUser = localStorage.getItem("user");

    if (token) {
      try {
        const data = await getUserProfile(token);

        if (data?.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          return;
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }

  initUser();
}, []);

  const isAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === "true";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check for existing auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleAuthSuccess = (userData: AuthResponse["user"], token: string) => {
    setUser(userData);
    setIsMobileDrawerOpen(false);
  };

  const handleLogout = () => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      setUser(null);
    }
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-4 left-0 right-0 z-40 transition-all duration-500 flex justify-center px-4 ${isScrolled ? "opacity-100" : "opacity-100"
          }`}
      >
        <nav className="w-full max-w-4xl flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-md border border-black rounded-2xl shadow-lg">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-red-600 shrink-0"></div>
            <span className="text-2xl font-bold text-white">Vantic</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-7">
            <a
              href="#how-it-works"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a
              href="https://x.com/vantictech"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
                <path d="M9.294 6.928 14.357 1h-1.2L8.762 6.147 5.25 1H1l5.31 7.722L1 15.143h1.2l4.642-5.396 3.708 5.396H15zM7.38 8.98l-.538-.77L2.64 1.908h1.843l3.454 4.942.537.769 4.491 6.423h-1.843z" />
              </svg>
              X
            </a>
            <button
              onClick={() => setShowTelegram(true)}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.9 5.4-1.37 6.43c-.1.45-.37.56-.75.35l-2.06-1.52-.99.96c-.11.11-.2.2-.41.2l.15-2.1 3.8-3.43c.16-.15-.04-.23-.25-.08L4.32 9.87l-2-.62c-.43-.14-.44-.43.09-.63l7.62-2.94c.36-.13.68.09.57.62z" />
              </svg>
              Telegram
            </button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:block">
            <GlowButton href="/app" size="sm">
              Launch App
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </GlowButton>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white"
            onClick={() => setIsMobileDrawerOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {isMobileDrawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-black rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-red-600 shrink-0"></div>
                  <span className="text-xl font-bold text-white">Vantic</span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <GlowButton href="/app" size="sm" className="w-full">
                  Launch App →
                </GlowButton>
              </div>

              <div className="pt-4 border-t border-white/10">
                <a
                  href="#how-it-works"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="block py-3 text-zinc-400 hover:text-white transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="https://x.com/vantictech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-3 text-zinc-400 hover:text-white transition-colors"
                >
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
                    <path d="M9.294 6.928 14.357 1h-1.2L8.762 6.147 5.25 1H1l5.31 7.722L1 15.143h1.2l4.642-5.396 3.708 5.396H15zM7.38 8.98l-.538-.77L2.64 1.908h1.843l3.454 4.942.537.769 4.491 6.423h-1.843z" />
                  </svg>
                  X (Twitter)
                </a>
                <button
                  onClick={() => { setIsMobileDrawerOpen(false); setShowTelegram(true); }}
                  className="flex items-center gap-2 py-3 w-full text-left text-zinc-400 hover:text-white transition-colors"
                >
                  <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
                    <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.9 5.4-1.37 6.43c-.1.45-.37.56-.75.35l-2.06-1.52-.99.96c-.11.11-.2.2-.41.2l.15-2.1 3.8-3.43c.16-.15-.04-.23-.25-.08L4.32 9.87l-2-.62c-.43-.14-.44-.43.09-.63l7.62-2.94c.36-.13.68.09.57.62z" />
                  </svg>
                  Telegram
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {showTelegram && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowTelegram(false)}
        >
          <div className="glass-card rounded-[16px] p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto mb-5 rounded-[12px] bg-red-950/50 border border-red-900/30 flex items-center justify-center text-red-400">
              <svg viewBox="0 0 16 16" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.9 5.4-1.37 6.43c-.1.45-.37.56-.75.35l-2.06-1.52-.99.96c-.11.11-.2.2-.41.2l.15-2.1 3.8-3.43c.16-.15-.04-.23-.25-.08L4.32 9.87l-2-.62c-.43-.14-.44-.43.09-.63l7.62-2.94c.36-.13.68.09.57.62z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Coming to Telegram soon</h3>
            <p className="text-sm text-zinc-400 mb-6">Our Telegram community is on the way. Stay tuned.</p>
            <GlowButton onClick={() => setShowTelegram(false)} size="sm" className="w-full">
              Got it
            </GlowButton>
          </div>
        </div>
      )}
    </>
  );
}
