"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { TradePanel } from "@/components/dashboard/predict/trade-panel";
import { getV2Event, JupiterEvent, Market, GameScore } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowLeft, Wifi, ExternalLink } from "lucide-react";

function microUsdToDisplay(microUsd: string): string {
  const n = Number(microUsd);
  if (!n) return "$0";
  const d = n / 1_000_000;
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`;
  if (d >= 1_000) return `$${(d / 1_000).toFixed(1)}K`;
  return `$${d.toFixed(0)}`;
}

function MarketRow({
  market,
  selected,
  onSelect,
}: {
  market: Market;
  selected: boolean;
  onSelect: () => void;
}) {
  const yes = market.pricing?.buyYesPriceUsd;
  const no = market.pricing?.buyNoPriceUsd;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition space-y-2",
        selected
          ? "border-white/30 bg-white/5"
          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white">{market.title}</p>
        {market.status !== "open" && (
          <span className="text-[10px] text-zinc-500 border border-white/10 rounded px-1.5 py-0.5 whitespace-nowrap">
            {market.status}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <span className="text-xs font-semibold text-green-400">
          YES {yes != null ? `${Math.round(yes * 100)}¢` : "—"}
        </span>
        <span className="text-zinc-700">·</span>
        <span className="text-xs font-semibold text-red-400">
          NO {no != null ? `${Math.round(no * 100)}¢` : "—"}
        </span>
      </div>
    </button>
  );
}

export default function PredictEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<JupiterEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  useEffect(() => {
    if (!eventId) return;
    getV2Event(eventId, true)
      .then((e) => {
        setEvent(e);
        const firstOpen = e.markets?.find((m) => m.status === "open") ?? e.markets?.[0] ?? null;
        setSelectedMarket(firstOpen);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <DashboardClient>
        <div className="space-y-4 max-w-2xl">
          <Skeleton className="h-8 w-48 bg-white/5" />
          <Skeleton className="h-48 w-full bg-white/5 rounded-xl" />
          <Skeleton className="h-32 w-full bg-white/5 rounded-xl" />
        </div>
      </DashboardClient>
    );
  }

  if (!event) {
    return (
      <DashboardClient>
        <div className="text-center py-16">
          <p className="text-zinc-500">Event not found.</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-zinc-400 underline">
            Go back
          </button>
        </div>
      </DashboardClient>
    );
  }

  const score = event.liveScore as GameScore | null;
  const imageUrl = event.metadata?.imageUrl;

  return (
    <DashboardClient>
      <div className="max-w-2xl space-y-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Hero */}
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
          {imageUrl && (
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
          )}
          <div className="relative p-6 space-y-3">
            <div className="flex items-center gap-2">
              {event.isLive && (
                <span className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                  <Wifi size={10} className="animate-pulse" /> LIVE
                </span>
              )}
              <span className="text-xs text-zinc-500 capitalize">{event.category}</span>
              <span className="text-xs text-zinc-700">·</span>
              <span className="text-xs text-zinc-600">Vol {microUsdToDisplay(event.volumeUsd)}</span>
            </div>

            <h1 className="text-xl font-bold text-white">
              {event.metadata?.title || event.eventId}
            </h1>

            {event.metadata?.subtitle && (
              <p className="text-sm text-zinc-400">{event.metadata.subtitle}</p>
            )}

            {score?.score && (
              <div className="flex items-center gap-4 pt-1">
                <span className="text-zinc-300 text-sm">{score.homeTeam}</span>
                <span className="text-2xl font-black text-white tabular-nums">{score.score}</span>
                <span className="text-zinc-300 text-sm">{score.awayTeam}</span>
                {score.live && (
                  <span className="text-green-400 text-xs ml-auto">
                    {score.period} {score.elapsed && `${score.elapsed}'`}
                  </span>
                )}
              </div>
            )}

            {event.rulesPdf && (
              <a
                href={event.rulesPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition"
              >
                Rules <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        {/* Markets */}
        {event.markets && event.markets.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Markets</h2>
            <div className="space-y-2">
              {event.markets.map((m) => (
                <MarketRow
                  key={m.marketId}
                  market={m}
                  selected={selectedMarket?.marketId === m.marketId}
                  onSelect={() => setSelectedMarket(m)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Trade panel */}
        {selectedMarket && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Trade · {selectedMarket.title}
            </h2>
            <TradePanel market={selectedMarket} />
          </div>
        )}
      </div>
    </DashboardClient>
  );
}
