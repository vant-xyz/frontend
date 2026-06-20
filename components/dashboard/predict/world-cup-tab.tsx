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

// Prices come in as fixed-point integers where 1,000,000 = 1.00 USD = 100¢
function priceToCents(price: number | null | undefined): string {
  if (price == null) return "—";
  return `${Math.round(price / 10_000)}¢`;
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
      {score.ended && <span className="text-zinc-500">FT</span>}
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

  const yesP = pricing?.buyYesPriceUsd != null ? Math.round(pricing.buyYesPriceUsd / 10_000) : null;
  const noP  = pricing?.buyNoPriceUsd  != null ? Math.round(pricing.buyNoPriceUsd  / 10_000) : null;

  return (
    <div
      onClick={() => router.push(`/app/predict/${event.eventId}`)}
      className="glass-card relative overflow-hidden rounded-[16px] cursor-pointer group transition-all duration-200 hover:border-white/20 hover:shadow-red-950/20"
    >
      {/* Team banner image */}
      {imageUrl && (
        <div
          className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity duration-300"
          style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
        />
      )}

      <div className="relative p-5 space-y-4">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive && !hasEnded && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] bg-green-500/15 border border-green-500/25 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                <Wifi size={9} className="animate-pulse" /> Live
              </span>
            )}
            {hasEnded && (
              <span className="px-2.5 py-0.5 rounded-[6px] bg-white/5 border border-white/10 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                Final
              </span>
            )}
            {!isLive && !hasEnded && (
              <span className="flex items-center gap-1 text-zinc-600 text-[10px]">
                <Clock size={9} />
                {event.beginAt
                  ? new Date(Number(event.beginAt) * 1000).toLocaleString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })
                  : "Upcoming"}
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-700 tabular-nums">
            Vol {microUsdToDisplay(event.volume24hr)}
          </span>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-white flex-1 truncate">{homeTeam}</span>
          {score?.score ? (
            <span className="text-base font-bold text-white px-2 tabular-nums shrink-0">
              {score.score}
            </span>
          ) : (
            <span className="text-zinc-700 text-xs px-2 shrink-0">vs</span>
          )}
          <span className="text-sm font-semibold text-white flex-1 text-right truncate">{awayTeam}</span>
        </div>

        {score && <ScoreBadge score={score} />}

        {/* YES / NO price bars */}
        {(yesP != null || noP != null) && (
          <div className="space-y-2 pt-1">
            {/* probability bar */}
            {yesP != null && noP != null && (
              <div className="h-1 rounded-full overflow-hidden bg-white/5">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${yesP}%` }}
                />
              </div>
            )}
            <div className="flex gap-2">
              <div className={cn(
                "flex-1 py-2.5 rounded-[10px] text-center text-xs font-semibold border transition-all duration-200",
                yesP != null
                  ? "border-green-500/25 text-green-400 bg-green-500/8 hover:bg-green-500/15"
                  : "border-white/5 text-zinc-600"
              )}>
                YES {yesP != null ? `${yesP}¢` : "—"}
              </div>
              <div className={cn(
                "flex-1 py-2.5 rounded-[10px] text-center text-xs font-semibold border transition-all duration-200",
                noP != null
                  ? "border-red-500/25 text-red-400 bg-red-500/8 hover:bg-red-500/15"
                  : "border-white/5 text-zinc-600"
              )}>
                NO {noP != null ? `${noP}¢` : "—"}
              </div>
            </div>
          </div>
        )}
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
    <div className="space-y-8">
      {/* Section header */}
      <div className="relative">
        {/* ambient glow behind heading */}
        <div className="pointer-events-none absolute -top-8 left-0 w-64 h-32 bg-red-900/15 blur-[60px] rounded-full" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600 mb-2">
              Live Markets
            </p>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy size={26} className="text-yellow-500/80" />
              FIFA World Cup 2026
            </h1>
            <p className="text-zinc-500 text-sm mt-2">
              Predict match outcomes in real time
            </p>
          </div>
          {liveCount > 0 && (
            <span className="shrink-0 flex items-center gap-1.5 text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-[8px]">
              <Wifi size={11} className="animate-pulse" />
              {liveCount} live
            </span>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {(["all", "live", "upcoming"] as const).map((f) => {
          const label =
            f === "live"
              ? `Live${liveCount ? ` (${liveCount})` : ""}`
              : f.charAt(0).toUpperCase() + f.slice(1);
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-200 border",
                active
                  ? "bg-red-700 border-red-600/50 text-white shadow-sm shadow-red-950/40"
                  : "bg-white/[0.03] border-white/8 text-zinc-400 hover:text-white hover:border-white/15"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[16px] bg-white/4" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Trophy size={32} className="mx-auto mb-3 text-zinc-800" />
          <p className="text-sm text-zinc-600">
            No {filter === "all" ? "" : filter + " "}matches right now.
          </p>
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
