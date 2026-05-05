"use client"
import { MarketCard, MarketsList, MarketsListProps } from "@/components/dashboard/crypto/markets-list";
import { QuickTradeModal } from "@/components/dashboard/crypto/quick-trade-modal";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { usePriceFeed } from "@/hooks/use-price-feed";
import { getMarkets, Market, OrderSide } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@radix-ui/react-accordion";
import { HelpCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react"

const categories = ["All", "Crypto", "Politics", "Sports", "Finance", "Technology"];

export default function page() {    
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
    const [selectedSide, setSelectedSide] = useState<OrderSide>("YES");
    const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");
    

    const { prices } = usePriceFeed({ usePolling: true, pollingInterval: 500 })

    const loadMarkets = useCallback(async () => {
        try {
            const res = await getMarkets("GEM", "active", undefined, 50);
            setMarkets(res.markets);
            setError(null);
            if (loading) setLoading(false);
        } catch (err) {
            console.error("[MarketsList] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to load markets");
            if (loading) setLoading(false);
        }
    }, [loading]);
    

    useEffect(() => {
        loadMarkets();
        const interval = setInterval(loadMarkets, 2000);
        return () => clearInterval(interval);
    }, [loadMarkets]);

    console.log(markets)

    const handleQuickTrade = (market: Market, side: OrderSide) => {
        setSelectedMarket(market);
        setSelectedSide(side);
        setIsQuickTradeOpen(true);
    };

    const filteredMarkets = useMemo(() => {
    if (activeCategory === "All") return markets;
    return markets.filter(m => 
      m.category?.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [markets, activeCategory]);

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
                <Button
                    variant="outline" onClick={loadMarkets} className="mt-4">
                    Retry
                </Button>
            </div>
        );
    }

    if (markets.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">No active CAPPM markets</p>
                <p className="text-gray-500 text-sm mt-1">Check back later for new markets</p>
            </div>
        );
    }


    return (

        <DashboardClient>
            <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold text-white">
            Vantic Prediction Markets
          </h1>
          <p className="text-gray-400 mt-1">
            Trade probabilities on real-world events
          </p>
        </div>

        {/* ───────── CATEGORY TABS ───────── */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm whitespace-nowrap transition",
                activeCategory === cat
                  ? "bg-white text-black font-semibold"
                  : "bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ───────── TRENDING ROW ───────── */}
        <div className="overflow-x-auto">
          <div className="flex gap-3">
            {markets.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="min-w-[260px] bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition"
              >
                <p className="text-xs text-gray-400 mb-1">🔥 Trending</p>
                <h3 className="text-sm font-semibold text-white line-clamp-2">
                  {m.title}
                </h3>

                <div className="flex justify-between mt-4">
                  <span className="text-green-400 text-sm font-bold">
                    Yes {(m.current_price ?? 50).toFixed(1)}¢
                  </span>
                  <span className="text-red-400 text-sm font-bold">
                    No {(100 - (m.current_price ?? 50)).toFixed(1)}¢
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
                

                {/* How It Works Accordion */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="how-it-works" className="border-white/10">
                        <AccordionTrigger className="text-white hover:text-red-400">
                            <div className="flex items-center gap-2">
                                <HelpCircle size={18} className="text-gray-400" />
                                How CAPPM Markets Work
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-300 space-y-2">
                            <p>
                                Each market asks: <strong className="text-white">"Will {'{ASSET}'} price be above/below {'{TARGET}'} at expiry?"</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-gray-400">
                                <li>Buy <strong className="text-green-400">YES</strong> shares if you think the price will be above the target</li>
                                <li>Buy <strong className="text-red-400">NO</strong> shares if you think the price will be below the target</li>
                                <li>Each share pays <strong className="text-white">~$1.00</strong> if correct, ~$0 if wrong</li>
                                <li>Markets auto-settle at expiry and can be verified via <a href="/explorer" className="text-red-400 underline">Onchain Verifiable Markets (OVM)</a></li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* Markets List */}
                <MarketsList markets={filteredMarkets} error={error} loading={loading} reloadMarkets={loadMarkets} />
            </div>
        </DashboardClient>
    );

}