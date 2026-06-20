"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorldCupEvents, JupiterEvent, GameScore } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Trophy, Wifi, Clock } from "lucide-react";

function microUsdToDisplay(microUsd: string): string {
  const n = Number(microUsd);
  if (!n) return "$0";
  const dollars = n / 1_000_000;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

function priceToCents(price: number | null | undefined): string {
  if (price == null) return "—";
  return `${Math.round(price * 100)}¢`;
}

function ScoreBadge({ score }: { score: GameScore | null }) {
  if (!score) return null;
  return (
    <div className="flex items-center gap-2 text-xs">
      {score.live && (
        <span className="flex items-center gap-1 text-green-400 font-semibold">
          <Wifi size={10} className="animate-pulse" />
          LIVE {score.period && `· ${score.period}`} {score.elapsed && `${score.elapsed}'`}
        </span>
      )}
      {score.ended && <span className="text-gray-400">FT</span>}
      {score.score && (
        <span className="font-bold text-white text-sm tracking-wide">{score.score}</span>
      )}
    </div>
  );
}

function MatchCard({ event }: { event: JupiterEvent }) {
  const router = useRouter();
  const score = event.liveScore as GameScore | null;
  const market = event.markets?.[0];
  const pricing = market?.pricing;

  const title = event.metadata?.title || "Match";
  const homeTeam = score?.homeTeam ?? title.split(" vs ")?.[0] ?? "Home";
  const awayTeam = score?.awayTeam ?? title.split(" vs ")?.[1] ?? "Away";
  const imageUrl = event.metadata?.imageUrl;

  const isLive = event.isLive || score?.live;
  const hasEnded = score?.ended;

  return (
    <div
      onClick={() => router.push(`/app/predict/${event.eventId}`)}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition cursor-pointer group"
    >
      {imageUrl && (
        <div
          className="absolute inset-0 opacity-10 group-hover:opacity-15 transition"
          style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      )}
      <div className="relative p-4 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive && !hasEnded && (
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                Live
              </span>
            )}
            {hasEnded && (
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                Final
              </span>
            )}
            {!isLive && !hasEnded && (
              <span className="flex items-center gap-1 text-zinc-500 text-[10px]">
                <Clock size={10} />
                {event.beginAt
                  ? new Date(Number(event.beginAt) * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "Upcoming"}
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-600">Vol {microUsdToDisplay(event.volume24hr)}</span>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-white flex-1 truncate">{homeTeam}</span>
          {score?.score ? (
            <span className="text-base font-bold text-white px-2 tabular-nums">{score.score}</span>
          ) : (
            <span className="text-zinc-600 text-xs px-2">vs</span>
          )}
          <span className="text-sm font-semibold text-white flex-1 text-right truncate">{awayTeam}</span>
        </div>

        {score && <ScoreBadge score={score} />}

        {/* Prices */}
        <div className="flex gap-2 pt-1">
          <div className={cn(
            "flex-1 py-2 rounded-lg text-center text-xs font-semibold border transition",
            pricing?.buyYesPriceUsd != null
              ? "border-green-500/30 text-green-400 bg-green-500/5 hover:bg-green-500/10"
              : "border-white/5 text-zinc-600"
          )}>
            YES {priceToCents(pricing?.buyYesPriceUsd)}
          </div>
          <div className={cn(
            "flex-1 py-2 rounded-lg text-center text-xs font-semibold border transition",
            pricing?.buyNoPriceUsd != null
              ? "border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10"
              : "border-white/5 text-zinc-600"
          )}>
            NO {priceToCents(pricing?.buyNoPriceUsd)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorldCupTab() {
  const [events, setEvents] = useState<JupiterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "live" | "upcoming">("all");

  const load = useCallback(async () => {
    try {
      const res = await getWorldCupEvents({ includeMarkets: true } as any);
      setEvents(res.data);
    } catch {
      // silently retry on next interval
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = events.filter((e) => {
    if (filter === "live") return e.isLive;
    if (filter === "upcoming") return !e.isLive && !(e.liveScore as GameScore | null)?.ended;
    return true;
  });

  const liveCount = events.filter((e) => e.isLive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy size={22} className="text-yellow-500" />
            FIFA World Cup 2026
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Predict match outcomes in real time</p>
        </div>
        {liveCount > 0 && (
          <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
            <Wifi size={11} className="animate-pulse" />
            {liveCount} live
          </span>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {(["all", "live", "upcoming"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium capitalize transition",
              filter === f
                ? "bg-white text-black"
                : "bg-white/5 text-zinc-400 hover:text-white"
            )}
          >
            {f === "live" ? `Live${liveCount ? ` (${liveCount})` : ""}` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Trophy size={32} className="mx-auto mb-3 text-zinc-700" />
          <p className="text-sm">No {filter === "all" ? "" : filter + " "}matches right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event) => (
            <MatchCard key={event.eventId} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
