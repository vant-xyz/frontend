"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getLeaderboard, getMyLeaderboardRank, LeaderboardEntry } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReelAnimation } from "@/components/landing/reel-animation";
import { HelpCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BANNER_TEXTS = [
  "Trade and climb the leaderboard",
  "Every trade moves your rank",
  "Top traders earn the most glory",
  "Who is #1 today?",
];

function Avatar({ url, name, size = 36 }: { url?: string; name: string; size?: number }) {
  const initials = name?.[0]?.toUpperCase() ?? "?";
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-white/10 flex items-center justify-center font-bold text-white shrink-0"
    >
      {initials}
    </div>
  );
}

const MEDAL = ["🥇", "🥈", "🥉"];

function combinedScore(e: LeaderboardEntry) {
  return (e.vantic_points ?? 0) + (e.activity_score ?? 0);
}

function PodiumCard({ entry, pos }: { entry: LeaderboardEntry; pos: number }) {
  const heights = ["h-28", "h-20", "h-16"];
  const colors = [
    "border-yellow-400/40 bg-yellow-400/5",
    "border-gray-300/30 bg-gray-300/5",
    "border-orange-400/30 bg-orange-400/5",
  ];
  return (
    <div className={cn("flex flex-col items-center gap-2 flex-1", pos === 0 ? "order-2" : pos === 1 ? "order-1" : "order-3")}>
      <Avatar url={entry.profile_image_url} name={entry.username} size={pos === 0 ? 52 : 40} />
      <p className="text-xs font-semibold text-white truncate max-w-[80px] text-center">{entry.username}</p>
      <p className="text-[10px] text-gray-400">{combinedScore(entry).toFixed(1)} pts</p>
      <div className={cn("w-full rounded-t-lg border flex items-center justify-center text-lg", heights[pos], colors[pos])}>
        {MEDAL[pos]}
      </div>
    </div>
  );
}

function RankRow({ entry, highlight }: { entry: LeaderboardEntry; highlight?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl border transition",
      highlight
        ? "border-white/20 bg-white/10 sticky bottom-0"
        : "border-white/5 bg-white/[0.02] hover:bg-white/5"
    )}>
      <span className={cn("w-6 text-center text-sm font-mono shrink-0", entry.rank <= 3 ? "text-yellow-400" : "text-gray-500")}>
        {entry.rank}
      </span>
      <Avatar url={entry.profile_image_url} name={entry.username} size={32} />
      <span className="flex-1 text-sm font-medium text-white truncate">{entry.username}</span>
      <div className="flex gap-3 text-right shrink-0">
        <div className="hidden sm:block">
          <p className="text-xs text-gray-500">PnL</p>
          <p className={cn("text-xs font-semibold", entry.pnl >= 0 ? "text-green-400" : "text-red-400")}>
            {entry.pnl >= 0 ? "+" : ""}${entry.pnl.toFixed(2)}
          </p>
        </div>
        <div className="hidden sm:block">
          <p className="text-xs text-gray-500">Trades</p>
          <p className="text-xs font-semibold text-white">{entry.trades}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">VP</p>
          <p className="text-xs font-semibold text-primary">{(entry.vantic_points ?? 0).toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">AS</p>
          <p className="text-xs font-semibold text-accent">{(entry.activity_score ?? 0).toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}

function VPModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-background border-white/10 w-[calc(100%-32px)]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Vantic Points (VP)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>
            Vantic Points are the core reputation currency on Vantic. You earn them by taking real actions on the platform. They never reset and accumulate permanently over your lifetime on the platform.
          </p>
          <p>
            Unlike leaderboard scores that can fluctuate, VP is an absolute number that only ever grows (or decreases slightly from losing trades). It reflects your history of participation, risk-taking, and engagement.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">How you earn VP</p>
            <div className="divide-y divide-white/5 rounded-xl border border-white/5 overflow-hidden">
              {[
                ["Execute a trade", "+5"],
                ["Win a prediction market trade", "+20"],
                ["Lose a prediction market trade", "-20"],
                ["Create a VS event", "+150"],
                ["Join a VS event", "+125"],
                ["Win a VS event", "+200"],
                ["Lose a VS event", "+100"],
                ["Deposit funds", "Scales with amount"],
                ["Withdraw funds", "Scales with amount"],
                ["Sell an asset", "Scales with amount"],
              ].map(([action, pts]) => (
                <div key={action} className="flex items-center justify-between px-3 py-2 bg-white/[0.02]">
                  <span className="text-xs text-gray-300">{action}</span>
                  <span className={cn("text-xs font-semibold", pts.startsWith("+") ? "text-primary" : pts.startsWith("-") ? "text-red-400" : "text-accent")}>{pts}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
            <p className="text-xs font-bold text-white">Amount-based scaling</p>
            <p className="text-xs text-gray-400">
              Deposits, withdrawals, and asset sales use exponential formulas that reward larger amounts. A $10 deposit earns more than ten $1 deposits. The multiplier grows faster for asset sales than withdrawals, and faster for withdrawals than deposits.
            </p>
          </div>

          <p className="text-xs text-gray-500">
            Your final leaderboard rank is VP + Activity Score. So even a user with modest VP can outrank someone with high VP if their Activity Score is significantly higher.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ASModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-background border-white/10 w-[calc(100%-32px)]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Activity Score (AS)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>
            Activity Score measures how active you are relative to every other trader on Vantic. It is a percentile-based composite that is recomputed daily and sits on a 0 to 100 scale.
          </p>
          <p>
            A score of 80 means you are more active than 80% of all ranked users across the four dimensions below. A score of 100 is only achievable by the single most active user across all four dimensions simultaneously.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">The four dimensions</p>
            <div className="divide-y divide-white/5 rounded-xl border border-white/5 overflow-hidden">
              {[
                ["Profit and Loss", "25%", "Your total realized PnL from settled prediction markets. Higher PnL pushes your percentile up."],
                ["Trade count", "25%", "Total number of prediction market positions you have opened. More trades means a higher rank on this dimension."],
                ["Total deposits", "25%", "Cumulative USD deposited into Vantic across all time. Larger and more frequent deposits improve this score."],
                ["Total withdrawals", "25%", "Cumulative USD withdrawn from Vantic. This rewards users who actively move funds rather than sitting idle."],
              ].map(([dim, weight, desc]) => (
                <div key={dim} className="px-3 py-2.5 bg-white/[0.02] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{dim}</span>
                    <span className="text-xs font-bold text-accent">{weight}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
            <p className="text-xs font-bold text-white">How it is calculated</p>
            <p className="text-xs text-gray-400">
              Each dimension is ranked using PERCENT_RANK across all users with a username. The four percentiles are averaged with equal weight and multiplied by 100. So if your PnL is in the 60th percentile, your trade count in the 80th, deposits in the 50th, and withdrawals in the 70th, your AS is (0.60 + 0.80 + 0.50 + 0.70) / 4 * 100 = 65.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
            <p className="text-xs font-bold text-white">AS vs VP</p>
            <p className="text-xs text-gray-400">
              AS resets relative to the rest of the community every day. If other users become more active, your AS can drop even without doing anything. VP never resets. Together they reward both consistent platform engagement (AS) and raw lifetime participation (VP).
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [vpOpen, setVpOpen] = useState(false);
  const [asOpen, setAsOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const { entries: list } = await getLeaderboard(50);
      setEntries(list ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }

    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const { entry } = await getMyLeaderboardRank(token);
        setMyEntry(entry ?? null);
      } catch {
        // not ranked yet
      }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const myRankInList = myEntry ? entries.some(e => e.rank === myEntry.rank) : false;

  return (
    <DashboardClient>
      <div className="space-y-6 pb-20">

        <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 px-6 py-8">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "url('/media/images/banners/banner2.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.28,
            }}
          />
          <div className="relative">
            <h1 className="text-2xl font-bold text-white mb-1">Leaderboard</h1>
            <p className="text-sm font-medium text-white">
              <ReelAnimation texts={BANNER_TEXTS} rotateInterval={3000} animateOnHover={false} />
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setVpOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
              >
                <span className="text-xs font-bold text-primary">VP</span>
                <HelpCircle size={11} className="text-gray-400" />
              </button>
              <button
                onClick={() => setAsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
              >
                <span className="text-xs font-bold text-accent">AS</span>
                <HelpCircle size={11} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <VPModal open={vpOpen} onClose={() => setVpOpen(false)} />
        <ASModal open={asOpen} onClose={() => setAsOpen(false)} />

        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-xl" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-gray-500 text-sm py-12 text-center">No rankings yet. Start trading to appear here.</p>
        ) : (
          <>
            {top3.length >= 3 && (
              <div className="flex items-end gap-2 px-2">
                {top3.map((e, i) => <PodiumCard key={e.rank} entry={e} pos={i} />)}
              </div>
            )}

            <div className="space-y-2 relative">
              {rest.map(e => <RankRow key={e.rank} entry={e} />)}
              {myEntry && !myRankInList && (
                <div className="pt-2 border-t border-white/10">
                  <RankRow entry={myEntry} highlight />
                </div>
              )}
              {myEntry && myRankInList && (
                <RankRow entry={myEntry} highlight />
              )}
            </div>
          </>
        )}
      </div>
    </DashboardClient>
  );
}
