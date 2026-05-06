"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Shield, Zap, Trophy } from "lucide-react";

const steps = [
  { icon: Zap, label: "Create", body: "Set the event, pick your side, define the stake." },
  { icon: Shield, label: "Lock", body: "Both players confirm. Funds go into escrow — no trust required." },
  { icon: Trophy, label: "Settle", body: "Outcome is confirmed. Winner receives the full pot instantly." },
];

const mockChallenge = {
  title: "BTC closes above $105K on May 31?",
  creator: { initials: "DK", side: "YES", stake: "$50" },
  opponent: { initials: "??", side: "NO", stake: "$50" },
  pot: "$100",
  status: "Awaiting opponent",
};

export function VantVsSection() {
  const router = useRouter();

  return (
    <section id="vant-vs" className="relative py-24 lg:py-32 bg-black border-y border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">

        <div className="mb-16 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-red-500 font-black mb-4">VS Events</p>
          <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-none">
            Challenge anyone.<br />
            <span className="text-zinc-500">Escrow handles the rest.</span>
          </h2>
          <p className="mt-6 text-zinc-400 text-base leading-relaxed max-w-xl">
            Pick an event, set your stake, lock both sides into escrow. When the outcome lands, the winner collects automatically — no middleman, no dispute.
          </p>
          <Button
            onClick={() => router.push("/app/vs")}
            className="mt-8 h-11 px-8 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded-xl text-[11px] transition-colors"
          >
            Open VS Events
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">

          <div className="space-y-3">
            {steps.map(({ icon: Icon, label, body }, i) => (
              <div key={label} className="flex gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex-none flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 text-zinc-400">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Step {i + 1} — {label}</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden">

            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Live Challenge</p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-500">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                {mockChallenge.status}
              </span>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-base font-bold text-white leading-snug">{mockChallenge.title}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-400 font-black text-sm mx-auto mb-3">
                    {mockChallenge.creator.initials}
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Creator</p>
                  <p className="text-lg font-black text-green-400 mt-1">{mockChallenge.creator.side}</p>
                  <p className="text-xs text-zinc-500 mt-1">{mockChallenge.creator.stake} staked</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-zinc-500 font-black text-sm mx-auto mb-3">
                    {mockChallenge.opponent.initials}
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Opponent</p>
                  <p className="text-lg font-black text-red-400 mt-1">{mockChallenge.opponent.side}</p>
                  <p className="text-xs text-zinc-500 mt-1">{mockChallenge.opponent.stake} staked</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Pot</p>
                  <p className="text-2xl font-black text-white">{mockChallenge.pot}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Held In</p>
                  <p className="text-sm font-black text-zinc-300">Escrow</p>
                </div>
              </div>

              <button
                onClick={() => router.push("/app/vs")}
                className="w-full py-3 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
              >
                Accept Challenge
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
