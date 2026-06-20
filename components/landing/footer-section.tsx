"use client";

import Link from "next/link";
import { useState } from "react";
import { GlowButton } from "@/components/ui/glow-button";

export function FooterSection() {
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  return (
    <footer className="relative overflow-hidden bg-[#060810] pt-24">
      {/* Oversized VANTIC wordmark as background — cut off at the bottom edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden"
        style={{ height: "78%" }}
      >
        <span
          className="font-black whitespace-nowrap"
          style={{
            fontSize: "clamp(140px, 30vw, 460px)",
            letterSpacing: "-0.05em",
            lineHeight: 0.78,
            // letters sit below the baseline so the bottom is clipped by the footer edge
            transform: "translateY(22%)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(220,38,38,0.05) 55%, transparent 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          VANTIC
        </span>
      </div>

      {/* Content sits above the wordmark */}
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div
          className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 py-14"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-[7px] bg-red-600 shrink-0" />
            <span className="text-base font-semibold text-white">Vantic</span>
          </div>

          {/* Columns */}
          <div className="flex flex-wrap gap-10 sm:gap-16">
            <nav aria-label="Product" className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-600 mb-4">Product</span>
              <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors py-1.5">How it works</a>
              <Link href="/app" className="text-sm text-zinc-400 hover:text-white transition-colors py-1.5">Launch App</Link>
            </nav>

            <nav aria-label="Resources" className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-600 mb-4">Resources</span>
              <button
                onClick={() => setComingSoon("Whitepaper")}
                className="text-left text-sm text-zinc-400 hover:text-white transition-colors py-1.5"
              >
                Whitepaper
              </button>
              <button
                onClick={() => setComingSoon("Roadmap")}
                className="text-left text-sm text-zinc-400 hover:text-white transition-colors py-1.5"
              >
                Roadmap
              </button>
              <Link href="/terms-of-service" className="text-sm text-zinc-400 hover:text-white transition-colors py-1.5">Terms of Service</Link>
              <Link href="/privacy-policy" className="text-sm text-zinc-400 hover:text-white transition-colors py-1.5">Privacy Policy</Link>
              <a
                href="https://vantic.xyz/v1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-white transition-colors py-1.5 flex items-center gap-1"
              >
                Vantic v1
                <svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 10 10 2M5 2h5v5" />
                </svg>
              </a>
            </nav>

            <nav aria-label="Community" className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-600 mb-4">Community</span>
              <a
                href="https://x.com/vanticxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-white transition-colors py-1.5 flex items-center gap-2"
              >
                <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
                  <path d="M9.294 6.928 14.357 1h-1.2L8.762 6.147 5.25 1H1l5.31 7.722L1 15.143h1.2l4.642-5.396 3.708 5.396H15zM7.38 8.98l-.538-.77L2.64 1.908h1.843l3.454 4.942.537.769 4.491 6.423h-1.843z" />
                </svg>
                X (Twitter)
              </a>
            </nav>
          </div>
        </div>

        {/* Fine print */}
        <p
          className="py-5 text-xs text-zinc-700"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          © 2026 Vantic. Non-custodial. On Solana.
        </p>
      </div>

      {/* Coming soon modal */}
      {comingSoon && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
          onClick={() => setComingSoon(null)}
        >
          <div
            className="glass-card rounded-[16px] p-8 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto mb-5 rounded-[12px] bg-red-950/50 border border-red-900/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{comingSoon} coming soon</h3>
            <p className="text-sm text-zinc-400 mb-6">
              We are putting the finishing touches on the {comingSoon.toLowerCase()}. Check back shortly.
            </p>
            <GlowButton onClick={() => setComingSoon(null)} size="sm" className="w-full">
              Got it
            </GlowButton>
          </div>
        </div>
      )}
    </footer>
  );
}
