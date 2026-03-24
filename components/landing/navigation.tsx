"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "./auth-modal";
import { WaitlistModal } from "./waitlist-modal";
import type { AuthResponse } from "@/lib/api";

interface NavigationProps {
  onWaitlistOpen?: () => void;
}

export function Navigation({ onWaitlistOpen }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);

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
        className={`fixed top-4 left-0 right-0 z-40 transition-all duration-500 flex justify-center px-4 ${
          isScrolled ? "opacity-100" : "opacity-100"
        }`}
      >
        <nav className="w-full max-w-4xl flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-md border border-black rounded-2xl shadow-lg">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded"></div>
            <span className="text-2xl font-bold text-white">Vantic</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8">
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
              Vantic VS
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
              <Button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-500 transition-colors"
              >
                Start Trading
              </Button>
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
                  <div className="w-8 h-8 bg-red-600 rounded"></div>
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
                  <Button
                    onClick={() => {
                      setIsWaitlistModalOpen(true);
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 h-12"
                  >
                    Join Waitlist
                  </Button>
                  
                  {/* Authenticate - controlled by ENABLE_AUTH env */}
                  {isAuthEnabled ? (
                    <Button
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setIsMobileDrawerOpen(false);
                      }}
                      className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 h-12"
                    >
                      Authenticate
                    </Button>
                  ) : (
                    <div className="relative">
                      <Button
                        disabled
                        className="w-full bg-gray-800 text-gray-500 h-12 blur-[2px] pointer-events-none"
                      >
                        Authenticate
                      </Button>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-gray-400 bg-black px-2 py-1 rounded">Coming Soon</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-gray-800">
                <a
                  href="#how-it-works"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="block py-3 text-gray-400 hover:text-red-500 transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#vant-vs"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="block py-3 text-gray-400 hover:text-red-500 transition-colors"
                >
                  Vantic VS
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

      <WaitlistModal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
      />
    </>
  );
}
