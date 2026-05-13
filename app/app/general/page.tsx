"use client";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { getMarkets, Market, OrderSide, getOrderbook, getMarketVolume } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Share2, Clock } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QuickTradeModal } from "@/components/dashboard/crypto/quick-trade-modal";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ReelAnimation } from "@/components/landing/reel-animation";

const categories = ["All", "Crypto", "Politics", "Sports", "Finance", "Technology"];
const GEM_HEADER_TEXTS = ["Vantic GEM Markets", "Vantic General Event Markets"];
const GEM_SUBTITLE_TEXTS = ["sports", "politics", "technology", "finance", "crypto"];

export default function GeneralPage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedSide, setSelectedSide] = useState<OrderSide>("YES");
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [quotesByMarket, setQuotesByMarket] = useState<Record<string, { yes: number; no: number } | undefined>>({});
  const [volumeByMarket, setVolumeByMarket] = useState<Record<string, number | undefined>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const category = new URLSearchParams(window.location.search).get("category");
    if (!category) return;
    const matched = categories.find((c) => c.toLowerCase() === category.toLowerCase());
    if (matched) {
      setActiveCategory(matched);
    }
  }, []);

  const loadMarkets = useCallback(async () => {
    try {
      const res = await getMarkets("GEM", "active", undefined, 50);
      setMarkets(res.markets);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load markets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarkets();
    const interval = setInterval(loadMarkets, 5000);
    return () => clearInterval(interval);
  }, [loadMarkets]);

  const filteredMarketsRef = useRef<Market[]>([]);

  useEffect(() => {
    let active = true;
    const toCents = (v?: number) => {
      const n = Number(v ?? 0);
      if (!Number.isFinite(n)) return 0;
      return n <= 1 ? n * 100 : n;
    };
    const loadShared = async () => {
      const visible = filteredMarketsRef.current.slice(0, 20);
      if (!visible.length) return;
      const [quoteEntries, volumeEntries] = await Promise.all([
        Promise.all(visible.map(async (m) => {
          try {
            const ob = await getOrderbook(m.id);
            const bestYesBid = toCents(ob.orderbook?.yes_bids?.[0]?.price);
            const bestNoAsk = toCents(ob.orderbook?.no_asks?.[0]?.price);
            const yes = bestYesBid > 0 ? bestYesBid : toCents(ob.orderbook?.last_traded_price);
            const no = bestNoAsk > 0 ? bestNoAsk : (yes > 0 ? Math.max(0, 100 - yes) : 0);
            if (yes <= 0 || no <= 0) return [m.id, undefined] as const;
            return [m.id, { yes, no }] as const;
          } catch {
            return [m.id, undefined] as const;
          }
        })),
        Promise.all(visible.map(async (m) => {
          try {
            const vol = await getMarketVolume(m.id);
            return [m.id, Number(vol.volume?.volume ?? 0)] as const;
          } catch {
            return [m.id, undefined] as const;
          }
        })),
      ]);
      if (!active) return;
      setQuotesByMarket(prev => ({ ...prev, ...Object.fromEntries(quoteEntries) }));
      setVolumeByMarket(prev => ({ ...prev, ...Object.fromEntries(volumeEntries) }));
    };
    loadShared();
    const quotesInterval = setInterval(loadShared, 3000);
    return () => {
      active = false;
      clearInterval(quotesInterval);
    };
  }, []);

  const filteredMarkets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = markets.filter((m) => {
      if (activeCategory !== "All" && m.category?.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      return m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    });
    filteredMarketsRef.current = result;
    return result;
  }, [markets, activeCategory, searchQuery]);

  const handleQuickTrade = (market: Market, side: OrderSide) => {
    setSelectedMarket(market);
    setSelectedSide(side);
    setIsQuickTradeOpen(true);
  };

  return (
    <DashboardClient>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            <ReelAnimation texts={GEM_HEADER_TEXTS} rotateInterval={2800} />
          </h1>
          <p className="text-gray-400 mt-1 flex items-center gap-1">
            Trade
            <span className="text-white inline-flex">
              <ReelAnimation texts={GEM_SUBTITLE_TEXTS} rotateInterval={2200} />
            </span>
            probabilities in real time
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm whitespace-nowrap transition",
                activeCategory === cat ? "bg-white text-black font-semibold" : "bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="max-w-lg">
          <Button
            variant="outline"
            className="w-full h-12 bg-black border-gray-800 text-gray-400 hover:text-white hover:bg-gray-900 justify-start"
            onClick={() => setIsSearchOpen(true)}
          >
            <span className="text-gray-500">Search markets...</span>
            <kbd className="ml-auto px-2 py-0.5 text-xs bg-gray-800 rounded">⌘K</kbd>
          </Button>
        </div>

        {activeCategory === "All" && !searchQuery.trim() && (
          <div className="overflow-x-auto">
            <div className="flex gap-3">
              {markets.slice(0, 4).map((m) => (
                <GemCard
                  key={m.id}
                  market={m}
                  onQuickTrade={handleQuickTrade}
                  compact
                  liveQuote={quotesByMarket[m.id]}
                  liveVolume={volumeByMarket[m.id]}
                />
              ))}
            </div>
          </div>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-it-works" className="border-white/10">
            <AccordionTrigger className="text-white hover:text-red-400">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-gray-400" />
                How GEM Markets Work
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-300 space-y-2">
              <p>
                GEM markets let you trade <strong className="text-white">YES/NO probabilities</strong> on real-world outcomes.
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Buy <strong className="text-green-400">YES</strong> if you think the event will happen</li>
                <li>Buy <strong className="text-red-400">NO</strong> if you think it will not happen</li>
                <li>Prices update continuously and reflect market belief</li>
                <li>Winning side settles near <strong className="text-white">$1.00</strong> per share at resolution</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="space-y-4">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-2">Failed to load markets</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <Button variant="outline" onClick={loadMarkets} className="mt-4">Retry</Button>
            </div>
          ) : loading && markets.length === 0 ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full bg-white/5 rounded-xl" />
              ))}
            </>
          ) : filteredMarkets.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No markets found.</p>
          ) : (
            filteredMarkets.map((m) => (
              <GemCard
                key={m.id}
                market={m}
                onQuickTrade={handleQuickTrade}
                liveQuote={quotesByMarket[m.id]}
                liveVolume={volumeByMarket[m.id]}
              />
            ))
          )}
        </div>
      </div>

      {selectedMarket && (
        <QuickTradeModal
          isOpen={isQuickTradeOpen}
          onClose={() => {
            setIsQuickTradeOpen(false);
            setSelectedMarket(null);
          }}
          market={selectedMarket}
          selectedSide={selectedSide}
        />
      )}

      <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} title="Search GEM Markets" description="Find markets by title or description">
        <CommandInput
          placeholder="Type to search GEM markets..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No markets found.</CommandEmpty>
          <CommandGroup>
            {filteredMarkets.map((m) => (
              <CommandItem
                key={m.id}
                onSelect={() => {
                  router.push(`/market/${m.id}`);
                  setIsSearchOpen(false);
                }}
                className="cursor-pointer"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{m.title}</span>
                  <span className="text-xs text-gray-400">{m.category || "General"} • {m.status}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </DashboardClient>
  );
}

function GemCard({
  market,
  onQuickTrade,
  compact = false,
  liveQuote,
  liveVolume,
}: {
  market: Market;
  onQuickTrade: (market: Market, side: OrderSide) => void;
  compact?: boolean;
  liveQuote?: { yes: number; no: number };
  liveVolume?: number;
}) {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [timeText, setTimeText] = useState("--:--");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(market.end_time_utc).getTime() - Date.now();
      if (diff <= 0) return setTimeText("0s");
      const sec = Math.floor(diff / 1000);
      if (sec < 60) return setTimeText(`${sec}s`);
      const min = Math.floor(sec / 60);
      if (min < 60) return setTimeText(`${min}m ${sec % 60}s`);
      const hr = Math.floor(min / 60);
      if (hr < 24) return setTimeText(`${hr}h ${min % 60}m`);
      const day = Math.floor(hr / 24);
      if (day < 7) return setTimeText(`${day}d ${hr % 24}h`);
      const week = Math.floor(day / 7);
      if (week < 4) return setTimeText(`${week}w ${day % 7}d`);
      const month = Math.floor(day / 30);
      if (month < 12) return setTimeText(`${month}mo`);
      const year = Math.floor(day / 365);
      return setTimeText(`${year}y ${Math.floor((day % 365) / 30)}mo`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [market.end_time_utc]);

  const yesCents = liveQuote?.yes;
  const noCents = liveQuote?.no;
  const banner = market.market_image_banner || market.market_image_small || "/media/images/hero_image.png";
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://vantic.xyz"}/market/${market.id}`;
  const previewImageUrl = `${typeof window !== "undefined" ? window.location.origin : "https://vantic.xyz"}/app/general/${market.id}/opengraph-image`;

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 cursor-pointer",
          compact ? "min-w-[260px]" : ""
        )}
        onClick={() => router.push(`/market/${market.id}`)}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url(${banner})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-400 mb-1">{compact ? "🔥 Trending" : (market.category || "General")}</p>
              <h3 className="text-sm font-semibold text-white line-clamp-2">{market.title}</h3>
              <p className="mt-2 text-xs text-gray-400 flex items-center gap-1"><Clock size={12} />{timeText}</p>
              <div className="mt-1 text-xs text-gray-400">
                {typeof liveVolume === "number" ? (
                  <p>Vol ${liveVolume.toFixed(2)}</p>
                ) : (
                  <Skeleton className="h-3 w-20 bg-white/10" />
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-300 hover:text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                setShareOpen(true);
              }}
            >
              <Share2 size={14} />
            </Button>
          </div>

          <div className="flex justify-between mt-4" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" className="border-green-500/40 text-green-400" onClick={() => onQuickTrade(market, "YES")}>
              {typeof yesCents === "number" ? `Yes ${yesCents.toFixed(1)}¢` : <Skeleton className="h-4 w-16 bg-green-500/15" />}
            </Button>
            <Button variant="outline" className="border-red-500/40 text-red-400" onClick={() => onQuickTrade(market, "NO")}>
              {typeof noCents === "number" ? `No ${noCents.toFixed(1)}¢` : <Skeleton className="h-4 w-16 bg-red-500/15" />}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="bg-black border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Share Market</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-white/10">
              <img
                src={previewImageUrl}
                alt={`${market.title} preview`}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = market.market_image_banner || market.market_image_small || "/media/images/hero_image.png";
                }}
              />
            </div>
            <p className="text-xs text-gray-400">{shareUrl}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={async () => { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied"); }}>Copy Link</Button>
              <Button variant="outline" onClick={async () => {
                if (navigator.share) await navigator.share({ title: market.title, text: market.description, url: shareUrl });
                else { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied"); }
              }}>Share</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
