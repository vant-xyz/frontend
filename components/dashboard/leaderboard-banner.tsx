"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LeaderboardBanner() {
  return (
    <>
      <style>{`
        @keyframes nudge-right {
          0%, 100% { transform: translateX(0px); }
          55% { transform: translateX(6px); }
        }
        .nudge-right { animation: nudge-right 1.5s ease-in-out infinite; }
      `}</style>
      <Link
        href="/app/leaderboard"
        className="relative flex items-center justify-between overflow-hidden rounded-xl border border-white/10 px-5 py-4 hover:border-white/20 transition-colors"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "url('/media/images/banners/banner2.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.13,
          }}
        />
        <div className="relative">
          <p className="text-sm font-semibold text-white">Trade and climb the leaderboard</p>
          <p className="mt-0.5 text-xs text-gray-400">See how you rank among all Vantic traders</p>
        </div>
        <ArrowRight size={18} className="nudge-right relative ml-4 shrink-0 text-white/60" />
      </Link>
    </>
  );
}
