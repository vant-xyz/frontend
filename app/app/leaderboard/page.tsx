"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getLeaderboard, getMyLeaderboardRank, LeaderboardEntry } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

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
        <div>
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <p className="text-gray-400 mt-1 text-sm">Ranked by Vantic Points + Activity Score</p>
        </div>

        <div className="flex gap-4 text-xs text-gray-500">
          <span><span className="text-primary font-semibold">VP</span> — Vantic Points earned from trading and events</span>
          <span><span className="text-accent font-semibold">AS</span> — Activity Score (0–100) from relative activity</span>
        </div>

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
