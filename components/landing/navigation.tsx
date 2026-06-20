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
          <div className="hidden lg:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              How It Works
            </a>
          </div>

          {/* Desktop Auth Button / User Menu */}
          <div className="hidden lg:block">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  {user.username || user.vant_id}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <GlowButton href="/app" size="sm">
                Launch App
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </GlowButton>
            )}
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

              {user ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Logged in as</p>
                    <p className="text-white font-semibold">{user.username || user.vant_id}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <GlowButton href="/app" size="sm" className="w-full">
                    Launch App →
                  </GlowButton>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                <a
                  href="#how-it-works"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="block py-3 text-zinc-400 hover:text-white transition-colors"
                >
                  How It Works
                </a>
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

    </>
  );
}
