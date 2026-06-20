"use client";

import Link from "next/link";
import { useState } from "react";
import { GlowButton } from "@/components/ui/glow-button";

type Modal = { title: string; body: string };

// ── small inline icons ───────────────────────────────
const DocIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 1.5H4.5A1.5 1.5 0 0 0 3 3v10a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 13V5.5z" />
    <path d="M9 1.5V5.5H13M5.5 8.5h5M5.5 11h3" />
  </svg>
);
const MapIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12c2-4 4-8 7-8s4 4 5 4" />
    <circle cx="14" cy="8" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="2" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
const FileIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="1.5" width="10" height="13" rx="1.5" /><path d="M6 5h4M6 8h4M6 11h2.5" />
  </svg>
);
const ExtIcon = () => (
  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 10 10 2M5 2h5v5" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
    <path d="M9.294 6.928 14.357 1h-1.2L8.762 6.147 5.25 1H1l5.31 7.722L1 15.143h1.2l4.642-5.396 3.708 5.396H15zM7.38 8.98l-.538-.77L2.64 1.908h1.843l3.454 4.942.537.769 4.491 6.423h-1.843z" />
  </svg>
);
const TelegramIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.9 5.4-1.37 6.43c-.1.45-.37.56-.75.35l-2.06-1.52-.99.96c-.11.11-.2.2-.41.2l.15-2.1 3.8-3.43c.16-.15-.04-.23-.25-.08L4.32 9.87l-2-.62c-.43-.14-.44-.43.09-.63l7.62-2.94c.36-.13.68.09.57.62z" />
  </svg>
);

const linkCls = "text-sm text-zinc-400 hover:text-white transition-colors py-1.5 flex items-center gap-2";

export function FooterSection() {
  const [modal, setModal] = useState<Modal | null>(null);

  return (
    <footer className="relative overflow-hidden bg-[#060810] pt-20 pb-[7vw]">
      {/* Blended seam — how-it-works color fades down into the footer blue.
          Starts above the edge (clipped by overflow-hidden) so the top is fully
          opaque at the boundary, leaving no faint blue line, then fades over a
          long distance into the footer. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-80 z-[1] blur-2xl bg-gradient-to-b from-[#0a0404] via-[#0a0404] to-transparent"
      />
      {/* Oversized VANTIC wordmark — sits as a background behind the content,
          only the bottom ~18% is cut off by the footer's bottom edge. */}
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute left-1/2 bottom-0 z-0 font-black whitespace-nowrap"
        style={{
          fontSize: "clamp(80px, 19vw, 360px)",
          lineHeight: 0.8,
          letterSpacing: "-0.05em",
          transform: "translate(-50%, 18%)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(220,38,38,0.05) 60%, transparent 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        VANTIC
      </span>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 py-12">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-[7px] bg-red-600 shrink-0" />
            <span className="text-base font-semibold text-white">Vantic</span>
          </div>

          {/* Columns — 2-up on mobile, row on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10 lg:flex lg:gap-16">
            <nav aria-label="Product" className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-600 mb-3">Product</span>
              <a href="#how-it-works" className={linkCls}>How it works</a>
              <Link href="/app" className={linkCls}>Launch App</Link>
            </nav>

            <nav aria-label="Resources" className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-600 mb-3">Resources</span>
              <button
                onClick={() =>
                  setModal({ title: "Whitepaper coming soon", body: "We are putting the finishing touches on the whitepaper. Check back shortly." })
                }
                className={`${linkCls} text-left`}
              >
                <DocIcon /> Whitepaper
              </button>
              <button
                onClick={() =>
                  setModal({ title: "Roadmap coming soon", body: "The public roadmap is on the way. Check back shortly." })
                }
                className={`${linkCls} text-left`}
              >
                <MapIcon /> Roadmap
              </button>
              <Link href="/terms-of-service" className={linkCls}><FileIcon /> Terms of Service</Link>
              <Link href="/privacy-policy" className={linkCls}><FileIcon /> Privacy Policy</Link>
              <a href="https://vantic.xyz/v1" target="_blank" rel="noopener noreferrer" className={linkCls}>
                Vantic v1 <ExtIcon />
              </a>
            </nav>

            <nav aria-label="Community" className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-600 mb-3">Community</span>
              <a href="https://x.com/vantictech" target="_blank" rel="noopener noreferrer" className={linkCls}>
                <XIcon /> X (Twitter)
              </a>
              <button
                onClick={() =>
                  setModal({ title: "Coming to Telegram soon", body: "Our Telegram community is on the way. Stay tuned." })
                }
                className={`${linkCls} text-left`}
              >
                <TelegramIcon /> Telegram
              </button>
            </nav>
          </div>
        </div>

        {/* Fine print */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <p className="py-5 text-xs text-zinc-700">
          © 2026 Vantic. Non-custodial. On Solana.
        </p>
      </div>

      {/* Coming soon modal */}
      {modal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div className="glass-card rounded-[16px] p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto mb-5 rounded-[12px] bg-red-950/50 border border-red-900/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{modal.title}</h3>
            <p className="text-sm text-zinc-400 mb-6">{modal.body}</p>
            <GlowButton onClick={() => setModal(null)} size="sm" className="w-full">
              Got it
            </GlowButton>
          </div>
        </div>
      )}
    </footer>
  );
}
