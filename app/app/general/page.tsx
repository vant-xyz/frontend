"use client";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getV2Events, JupiterEvent } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Search } from "lucide-react";

const CATEGORIES = [
  { label: "All", value: undefined },
  { label: "Crypto", value: "crypto" },
  { label: "Politics", value: "politics" },
  { label: "Sports", value: "sports" },
  { label: "Esports", value: "esports" },
  { label: "Culture", value: "culture" },
  { label: "Economics", value: "economics" },
  { label: "Tech", value: "tech" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

function microUsdToDisplay(microUsd: string): string {
  const n = Number(microUsd);
  if (!n) return "$0";
  const d = n / 1_000_000;
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`;
  if (d >= 1_000) return `$${(d / 1_000).toFixed(1)}K`;
  return `$${d.toFixed(0)}`;
}

function EventCard({ event }: { event: JupiterEvent }) {
  const router = useRouter();
  const market = event.markets?.[0];
  const yes = market?.pricing?.buyYesPriceUsd;
  const no = market?.pricing?.buyNoPriceUsd;
  const imageUrl = event.metadata?.imageUrl;

  return (
    <div
      onClick={() => router.push(`/app/predict/${event.eventId}`)}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition cursor-pointer group p-4 space-y-3"
    >
      {imageUrl && (
        <div
          className="absolute inset-0 opacity-10 group-hover:opacity-15 transition"
          style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      )}
      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{event.subcategory || event.category}</p>
            <h3 className="text-sm font-semibold text-white line-clamp-2">{event.metadata?.title || event.eventId}</h3>
          </div>
          {event.isLive && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <span className="text-xs font-semibold text-green-400">
              YES {yes != null ? `${Math.round(yes * 100)}¢` : "—"}
            </span>
            <span className="text-xs font-semibold text-red-400">
              NO {no != null ? `${Math.round(no * 100)}¢` : "—"}
            </span>
          </div>
          <span className="text-[10px] text-zinc-600">Vol {microUsdToDisplay(event.volume24hr)}</span>
        </div>
      </div>
    </div>
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
    <DashboardClient>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutGrid size={22} className="text-zinc-400" />
            General Markets
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Crypto, politics, tech, and more</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => setCategory(c.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition",
                category === c.value
                  ? "bg-white text-black"
                  : "bg-white/5 text-zinc-400 hover:text-white"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <LayoutGrid size={32} className="mx-auto mb-3 text-zinc-700" />
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
    </DashboardClient>
  );
}
