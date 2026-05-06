"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function VantVsSection() {
  const router = useRouter();

  return (
    <section id="vant-vs" className="relative py-20 lg:py-24 bg-black border-y border-white/5 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-red-500 font-bold">VS Events</p>
            <h2 className="mt-3 text-4xl lg:text-5xl font-black text-white tracking-tight">
              One-on-one event wagers,
              <span className="text-zinc-400"> settled by outcome.</span>
            </h2>
            <p className="mt-5 text-zinc-300 leading-relaxed max-w-xl">
              Create a private or public challenge, set stake amount, invite an opponent, and lock both sides into escrow.
              Once the event result is confirmed, payout is computed and distributed to the winner.
            </p>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest">1</p>
                <p className="text-white font-semibold">Create Event</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest">2</p>
                <p className="text-white font-semibold">Stake & Confirm</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest">3</p>
                <p className="text-white font-semibold">Settle Winner</p>
              </div>
            </div>

            <Button
              onClick={() => router.push("/app/vs")}
              className="mt-8 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl px-6"
            >
              Open VS Events
            </Button>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Challenge Graph</span>
                <span>Minimal Preview</span>
              </div>

              <div className="mt-5 h-44 rounded-xl border border-white/10 bg-black/60 relative overflow-hidden">
                <div className="absolute left-8 top-10 w-16 h-16 rounded-full border-2 border-red-500/80 flex items-center justify-center text-red-400 font-bold text-xs">YOU</div>
                <div className="absolute right-8 top-10 w-16 h-16 rounded-full border-2 border-white/70 flex items-center justify-center text-white font-bold text-xs">OPP</div>
                <div className="absolute left-1/2 -translate-x-1/2 top-20 text-zinc-300 font-black tracking-widest">VS</div>

                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 180" fill="none" aria-hidden>
                  <path d="M95 88 C 145 130, 255 130, 305 88" stroke="rgba(239,68,68,0.75)" strokeWidth="2" strokeDasharray="5 5" />
                  <path d="M95 88 C 145 48, 255 48, 305 88" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
                </svg>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-white/[0.06] border border-white/15 px-3 py-1 text-[11px] text-zinc-200">
                  Escrow Locked → Outcome Confirmed → Winner Paid
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
