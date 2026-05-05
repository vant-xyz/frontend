"use client";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { getMarkets, Market, OrderSide } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Share2, Clock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QuickTradeModal } from "@/components/dashboard/crypto/quick-trade-modal";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const categories = ["All", "Crypto", "Politics", "Sports", "Finance", "Technology"];

export default function GeneralPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedSide, setSelectedSide] = useState<OrderSide>("YES");
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const loadMarkets = useCallback(async () => {
    try {
      const res = await getMarkets("GEM", "active", undefined, 50);
      setMarkets(res.markets);
      setError(null);
      if (loading) setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load markets");
      if (loading) setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    loadMarkets();
    const interval = setInterval(loadMarkets, 1000);
    return () => clearInterval(interval);
  }, [loadMarkets]);

  const filteredMarkets = useMemo(() => {
    if (activeCategory === "All") return markets;
    return markets.filter((m) => m.category?.toLowerCase() === activeCategory.toLowerCase());
  }, [markets, activeCategory]);

  const handleQuickTrade = (market: Market, side: OrderSide) => {
    setSelectedMarket(market);
    setSelectedSide(side);
    setIsQuickTradeOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-2">Failed to load markets</p>
        <p className="text-gray-400 text-sm">{error}</p>
        <Button variant="outline" onClick={loadMarkets} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <DashboardClient>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Vantic GEM Markets</h1>
          <p className="text-gray-400 mt-1">Trade event probabilities in real time</p>
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

        <div className="overflow-x-auto">
          <div className="flex gap-3">
            {markets.slice(0, 4).map((m) => (
              <GemCard key={m.id} market={m} onQuickTrade={handleQuickTrade} compact />
            ))}
          </div>
        </div>

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
          {filteredMarkets.map((m) => (
            <GemCard key={m.id} market={m} onQuickTrade={handleQuickTrade} />
          ))}
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
    </DashboardClient>
  );
}

function GemCard({ market, onQuickTrade, compact = false }: { market: Market; onQuickTrade: (market: Market, side: OrderSide) => void; compact?: boolean }) {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [timeText, setTimeText] = useState("--:--");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(market.end_time_utc).getTime() - Date.now();
      if (diff <= 0) return setTimeText("00:00");
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeText(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [market.end_time_utc]);

  const yes = Number(((market.current_price ?? 50) / 100).toFixed(2));
  const no = Number((100 - yes).toFixed(2));
  const banner = market.market_image_small || "/media/images/hero_image.png";
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://vantic.xyz"}/market/${market.id}`;

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
              <p className="text-xs text-gray-400 mb-1">🔥 Trending</p>
              <h3 className="text-sm font-semibold text-white line-clamp-2">{market.title}</h3>
              <p className="mt-2 text-xs text-gray-400 flex items-center gap-1"><Clock size={12} />{timeText}</p>
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
            <Button variant="outline" className="border-green-500/40 text-green-400" onClick={() => onQuickTrade(market, "YES")}>Yes {yes.toFixed(2)}¢</Button>
            <Button variant="outline" className="border-red-500/40 text-red-400" onClick={() => onQuickTrade(market, "NO")}>No {no.toFixed(2)}¢</Button>
          </div>
        </div>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="bg-black border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Share Market</DialogTitle></DialogHeader>
          <div className="space-y-3">
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
