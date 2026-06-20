"use client";

import { AppShell } from "@/components/dashboard/app-shell";
import { getV2Events, JupiterEvent } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Wifi } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const CATEGORIES = [
  { label: "All",       value: undefined },
  { label: "Crypto",    value: "crypto" },
  { label: "Politics",  value: "politics" },
  { label: "Sports",    value: "sports" },
  { label: "Esports",   value: "esports" },
  { label: "Culture",   value: "culture" },
  { label: "Economics", value: "economics" },
  { label: "Tech",      value: "tech" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

function microUsdToDisplay(microUsd: string | undefined): string {
  const n = Number(microUsd || 0);
  if (!n) return "$0";
  const d = n / 1_000_000;
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`;
  if (d >= 1_000) return `$${(d / 1_000).toFixed(1)}K`;
  return `$${d.toFixed(0)}`;
}

function priceToCents(price: number | null | undefined): number | null {
  if (price == null) return null;
  return Math.round(price / 10_000);
}

function EventCard({ event }: { event: JupiterEvent }) {
  const router = useRouter();
  const market = event.markets?.[0];
  const pricing = market?.pricing;
  const imageUrl = event.metadata?.imageUrl;
  const title = event.metadata?.title || event.eventId;

  const yesP = priceToCents(pricing?.buyYesPriceUsd);
  const noP  = priceToCents(pricing?.buyNoPriceUsd);

  const saferSide = yesP != null && noP != null
    ? (yesP >= noP ? { label: "YES", pct: yesP } : { label: "NO", pct: noP })
    : null;

  const cardInner = (
    <div
      onClick={() => router.push(`/app/predict/${event.eventId}`)}
      className="glass-card relative overflow-hidden rounded-[16px] cursor-pointer group transition-all duration-200 hover:border-white/20"
    >
      {imageUrl && (
        <div
          className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity duration-300"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      <div className="relative p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
              {event.subcategory || event.category}
            </p>
            <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {event.isLive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-green-500/15 border border-green-500/25 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                <Wifi size={8} className="animate-pulse" /> Live
              </span>
            )}
          </div>
        </div>

        {/* YES/NO + volume */}
        {(yesP != null || noP != null) && (
          <div className="space-y-2">
            {yesP != null && noP != null && (
              <div className="h-1 rounded-full overflow-hidden bg-red-900/50">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${yesP}%` }}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <span className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-[7px] border",
                  yesP != null
                    ? "text-green-400 border-green-500/25 bg-green-500/8"
                    : "text-zinc-600 border-white/5"
                )}>
                  YES {yesP != null ? `${yesP}¢` : "—"}
                </span>
                <span className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-[7px] border",
                  noP != null
                    ? "text-red-400 border-red-500/25 bg-red-500/8"
                    : "text-zinc-600 border-white/5"
                )}>
                  NO {noP != null ? `${noP}¢` : "—"}
                </span>
              </div>
              <span className="text-[10px] text-zinc-700 tabular-nums">
                Vol {microUsdToDisplay(event.volume24hr)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{cardInner}</HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="center"
        className="w-auto min-w-[200px] p-3 bg-[#0d0505] border border-white/10 rounded-[10px] shadow-xl"
      >
        <p className="text-xs font-semibold text-white mb-1 truncate">{title}</p>
        <div className="flex items-center gap-3 text-[11px]">
          {saferSide && (
            <span className={cn("font-bold", saferSide.label === "YES" ? "text-green-400" : "text-red-400")}>
              {saferSide.label} {saferSide.pct}¢
            </span>
          )}
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">Vol {microUsdToDisplay(event.volume24hr)}</span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export default function GeneralPage() {
  const [events, setEvents] = useState<JupiterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryValue>(undefined);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await getV2Events({
        category: category ?? undefined,
        includeMarkets: true,
        sortBy: "volume",
      });
      setEvents(res.data);
    } catch {
      // silently retry
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const filtered = search.trim()
    ? events.filter((e) =>
        (e.metadata?.title || e.eventId).toLowerCase().includes(search.toLowerCase())
      )
    : events;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative">
          <div className="pointer-events-none absolute -top-8 left-0 w-64 h-32 bg-red-900/15 blur-[60px] rounded-full" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600 mb-2">Markets</p>
          <h1 className="text-3xl font-bold text-white">General Markets</h1>
          <p className="text-zinc-500 text-sm mt-2">Crypto, politics, tech, and more</p>
        </div>

        {/* Category filter + search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.label}
                onClick={() => setCategory(c.value)}
                className={cn(
                  "px-4 py-1.5 rounded-[8px] text-xs font-medium whitespace-nowrap transition-all duration-200 border shrink-0",
                  category === c.value
                    ? "bg-red-700 border-red-600/50 text-white shadow-sm shadow-red-950/40"
                    : "bg-white/[0.03] border-white/8 text-zinc-400 hover:text-white hover:border-white/15"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative sm:w-56 shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-[10px] pl-8 pr-4 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-white/25 transition"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-[16px] bg-white/4" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <Search size={32} className="mx-auto mb-3 text-zinc-800" />
            <p className="text-sm">No events found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e) => (
              <EventCard key={e.eventId} event={e} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
