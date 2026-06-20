"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { TradePanel } from "@/components/dashboard/predict/trade-panel";
import {
  getV2Event,
  getMarketCandles,
  JupiterEvent,
  Market,
  GameScore,
  MarketCandle,
} from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowLeft, Wifi, ExternalLink, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function microUsdToDisplay(v: string | undefined): string {
  const n = Number(v || 0);
  if (!n) return "$0";
  const d = n / 1_000_000;
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`;
  if (d >= 1_000) return `$${(d / 1_000).toFixed(1)}K`;
  return `$${d.toFixed(0)}`;
}

function toPercent(raw: number | null | undefined): number | null {
  if (raw == null) return null;
  return Math.round(raw / 10_000);
}

function Countdown({ beginAt }: { beginAt: string | null }) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    if (!beginAt) return;
    const target = Number(beginAt) * 1000;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setDisplay("Starting now"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setDisplay(`${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [beginAt]);
  if (!display) return null;
  return <span className="tabular-nums">{display}</span>;
}

type ChartPoint = { label: string; yes: number };
type Range = "1D" | "1W" | "1M" | "ALL";

function ProbabilityChart({ marketId }: { marketId: string }) {
  const [raw, setRaw] = useState<MarketCandle[]>([]);
  const [range, setRange] = useState<Range>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMarketCandles(marketId)
      .then((r) => setRaw(r.candles ?? []))
      .catch(() => setRaw([]))
      .finally(() => setLoading(false));
  }, [marketId]);

  const filtered = (() => {
    if (!raw.length) return [];
    const now = Date.now() / 1000;
    const cutoff: Record<Range, number> = { "1D": now - 86400, "1W": now - 604800, "1M": now - 2592000, ALL: 0 };
    return raw.filter((c) => c.time >= cutoff[range]);
  })();

  const data: ChartPoint[] = filtered.map((c) => {
    const yes = c.close > 1 ? Math.round(c.close / 10_000) : Math.round(c.close * 100);
    const d = new Date(c.time * 1000);
    const label = range === "1D"
      ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return { label, yes };
  });

  if (loading) return <Skeleton className="h-44 w-full rounded-xl bg-white/4" />;

  if (!data.length) {
    return (
      <div className="h-36 flex flex-col items-center justify-center gap-2 text-zinc-700">
        <TrendingUp size={26} />
        <p className="text-xs">No chart data yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end gap-1 mb-2">
        {(["1D","1W","1M","ALL"] as Range[]).map((r) => (
          <button key={r} onClick={() => setRange(r)}
            className={cn("px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all",
              range === r ? "bg-red-700/80 text-white" : "text-zinc-600 hover:text-zinc-300")}>
            {r}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="yesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill:"#52525b", fontSize:10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis domain={[0,100]} tick={{ fill:"#52525b", fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={{ background:"#0d0505", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, fontSize:12, color:"#fff" }}
            formatter={(v: number) => [`${v}¢`,"YES"]} labelStyle={{ color:"#71717a", marginBottom:2 }} />
          <Area type="monotone" dataKey="yes" stroke="#dc2626" strokeWidth={1.5} fill="url(#yesGrad)" dot={false} activeDot={{ r:4, fill:"#dc2626" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TeamOdds({ name, percent, active, onClick }: { name:string; percent:number|null; active?:boolean; onClick?:()=>void }) {
  return (
    <button onClick={onClick}
      className={cn("flex-1 flex flex-col items-center gap-1.5 py-4 px-3 rounded-[12px] border transition-all",
        active ? "border-white/20 bg-white/[0.06]" : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]")}>
      <span className="text-sm font-semibold text-white truncate max-w-full text-center">{name}</span>
      <span className={cn("text-xl font-black tabular-nums", percent != null && percent >= 50 ? "text-green-400" : "text-zinc-400")}>
        {percent != null ? `${percent}%` : "—"}
      </span>
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
        setSelectedMarket(e.markets?.find((m) => m.status === "open") ?? e.markets?.[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <Skeleton className="h-5 w-20 bg-white/5" />
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-4">
              <Skeleton className="h-44 w-full bg-white/5 rounded-[16px]" />
              <Skeleton className="h-52 w-full bg-white/5 rounded-[16px]" />
            </div>
            <Skeleton className="h-80 w-full bg-white/5 rounded-[16px]" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!event) {
    return (
      <AppShell>
        <div className="text-center py-24 text-zinc-600">
          <p>Event not found.</p>
          <button onClick={() => router.back()} className="mt-3 text-sm hover:text-white transition underline">Go back</button>
        </div>
      </AppShell>
    );
  }

  const score = event.liveScore as GameScore | null;
  const title = event.metadata?.title || event.eventId;
  const isLive = event.isLive || score?.live;
  const allMarkets = event.markets ?? [];
  const teamMarkets = allMarkets.filter((m) => m.isTeamMarket);
  const openMarkets = allMarkets.filter((m) => m.status === "open");

  const homeTeam = score?.homeTeam ?? title.split(" vs ")?.[0]?.trim() ?? "Home";
  const awayTeam = score?.awayTeam ?? title.split(" vs ")?.[1]?.trim() ?? "Away";
  const homeMarket = teamMarkets[0] ?? allMarkets[0] ?? null;
  const awayMarket = teamMarkets[1] ?? allMarkets[1] ?? null;
  const homePercent = toPercent(homeMarket?.pricing?.buyYesPriceUsd);
  const awayPercent = toPercent(awayMarket?.pricing?.buyYesPriceUsd);
  const activeChartMarket = selectedMarket ?? homeMarket;

  return (
    <AppShell>
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* LEFT */}
          <div className="space-y-4">
            {/* Event header */}
            <div className="glass-card rounded-[16px] p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
                {isLive && !score?.ended && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-green-500/15 border border-green-500/25 text-green-400 font-bold uppercase tracking-wider">
                    <Wifi size={9} className="animate-pulse" /> Live
                  </span>
                )}
                <span className="capitalize">{event.category}</span>
                <span className="text-zinc-700">·</span>
                <span>Vol {microUsdToDisplay(event.volumeUsd)}</span>
                {event.rulesPdf && (
                  <><span className="text-zinc-700">·</span>
                  <a href={event.rulesPdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white transition">
                    Rules <ExternalLink size={10} />
                  </a></>
                )}
              </div>

              <h1 className="text-xl font-bold text-white leading-snug">{title}</h1>

              {score?.score ? (
                <div className="flex items-center gap-4">
                  <span className="text-zinc-300 text-sm font-medium">{homeTeam}</span>
                  <span className="text-3xl font-black text-white tabular-nums">{score.score}</span>
                  <span className="text-zinc-300 text-sm font-medium">{awayTeam}</span>
                  {isLive && <span className="ml-auto text-green-400 text-xs font-semibold">{score.period} {score.elapsed && `${score.elapsed}'`}</span>}
                </div>
              ) : event.beginAt && Date.now() < Number(event.beginAt) * 1000 ? (
                <p className="text-sm text-zinc-400">
                  Begins in <span className="font-semibold text-white"><Countdown beginAt={event.beginAt} /></span>
                  {" · "}{new Date(Number(event.beginAt) * 1000).toLocaleString(undefined, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                </p>
              ) : null}

              {(homePercent != null || awayPercent != null) && (
                <div className="flex gap-3 pt-1">
                  <TeamOdds name={homeTeam} percent={homePercent}
                    active={selectedMarket?.marketId === homeMarket?.marketId}
                    onClick={() => homeMarket && setSelectedMarket(homeMarket)} />
                  <TeamOdds name={awayTeam} percent={awayPercent}
                    active={selectedMarket?.marketId === awayMarket?.marketId}
                    onClick={() => awayMarket && setSelectedMarket(awayMarket)} />
                </div>
              )}
            </div>

            {/* Chart */}
            {activeChartMarket && (
              <div className="glass-card rounded-[16px] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-600 mb-3">
                  YES probability · {activeChartMarket.title}
                </p>
                <ProbabilityChart marketId={activeChartMarket.marketId} />
              </div>
            )}

            {/* Market selector */}
            {allMarkets.length > 2 && (
              <div className="glass-card rounded-[16px] p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-600">All Markets</p>
                <div className="flex flex-wrap gap-2">
                  {(openMarkets.length ? openMarkets : allMarkets).map((m) => (
                    <button key={m.marketId} onClick={() => setSelectedMarket(m)}
                      className={cn("px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-all",
                        selectedMarket?.marketId === m.marketId
                          ? "bg-red-700/80 border-red-600/50 text-white"
                          : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white")}>
                      {m.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: trade panel */}
          <div className="lg:sticky lg:top-28">
            {selectedMarket ? (
              <div className="glass-card rounded-[16px] overflow-hidden">
                <div className="px-5 pt-5 pb-3 border-b border-white/[0.07]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600 mb-0.5">{title}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{selectedMarket.title}</p>
                    {selectedMarket.pricing?.buyYesPriceUsd != null && (
                      <span className="text-2xl font-black text-white tabular-nums">
                        {toPercent(selectedMarket.pricing.buyYesPriceUsd)}¢
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <TradePanel market={selectedMarket} />
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-[16px] p-8 text-center text-zinc-600 text-sm">
                No open market available.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
