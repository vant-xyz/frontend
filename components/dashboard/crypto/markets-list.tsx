"use client";

import { useEffect, useState, useCallback } from "react";
import { getMarkets, Market, OrderSide } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MoreHorizontal, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickTradeModal } from "./quick-trade-modal";
import { usePriceFeed } from "@/hooks/use-price-feed";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";

interface MarketsListProps {
  onMarketSelect: (market: Market) => void;
}

export function MarketsList({ onMarketSelect }: MarketsListProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedSide, setSelectedSide] = useState<OrderSide>("YES");
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  
  const { prices } = usePriceFeed({ usePolling: true, pollingInterval: 500 });

  const loadMarkets = useCallback(async () => {
    try {
      const res = await getMarkets("CAPPM", "active", undefined, 50);
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
        <Button variant="outline" onClick={loadMarkets} className="mt-4">
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
    <>
      <div className="space-y-4">
        {markets.map((market) => (
          <MarketCard 
            key={market.id} 
            market={market} 
            onSelect={onMarketSelect}
            onQuickTrade={handleQuickTrade}
            prices={prices}
          />
        ))}
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
    </>
  );
}

interface MarketCardProps {
  market: Market;
  onSelect: (market: Market) => void;
  onQuickTrade: (market: Market, side: OrderSide) => void;
  prices: any;
}

function MarketCard({ market, onSelect, onQuickTrade, prices }: MarketCardProps) {
  const [timeLeft, setTimeLeft] = useState<{ seconds: number; text: string }>({ seconds: 0, text: "" });

  useEffect(() => {
    const updateTimeLeft = () => {
      const endTime = new Date(market.end_time_utc).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft({ seconds: 0, text: "00:00" });
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft({ 
          seconds: diff / 1000,
          text: `${minutes}:${seconds.toString().padStart(2, '0')}`
        });
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [market.end_time_utc]);

  const currentPrice = market.current_price 
    ? (market.current_price / 100).toFixed(2)
    : "0.00";
  
  const targetPrice = market.target_price
    ? (market.target_price / 100).toFixed(2)
    : "0.00";

  const sharePrice = 50;

  const isSettling = timeLeft.seconds <= 0;

  return (
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all group">
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={`/media/images/crypto_assets/${(market.asset || 'BTC').toLowerCase()}.png`}
              alt={market.asset || 'Crypto'}
              className="w-10 h-10 rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">
                {market.title}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className={cn(
                  "flex items-center gap-1 font-mono",
                  timeLeft.seconds <= 60 && timeLeft.seconds > 0 ? "text-red-400" : "text-gray-400"
                )}>
                  <Clock size={12} />
                  {timeLeft.text}
                </span>
                <span>•</span>
                <span className="text-gray-400">{market.market_type}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className={cn(
            "border-green-500/50 text-green-400",
            isSettling && "border-yellow-500/50 text-yellow-400"
          )}>
            {isSettling ? "Settling" : "Active"}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 line-clamp-2">
          {market.description}
        </p>

        {/* Price Info & Trade Buttons */}
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-gray-500 text-xs mb-1">Current Price</p>
                <p className="text-lg font-mono text-white">${currentPrice}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Target</p>
                <p className="text-lg font-mono text-white flex items-center gap-2">
                  <Target size={16} className={market.direction === "Above" ? "text-green-400" : "text-red-400"} />
                  ${targetPrice}
                </p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 text-gray-400 hover:text-white hover:bg-white/10"
              onClick={() => onSelect(market)}
            >
              <MoreHorizontal size={20} />
            </Button>
          </div>

          {/* YES/NO Buttons or Settling */}
          {isSettling ? (
            <div className="py-4 text-center flex items-center justify-center gap-2">
              <Loader className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400 font-semibold animate-pulse">Settling...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                className="h-12 border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300 font-semibold"
                onClick={() => onQuickTrade(market, "YES")}
              >
                YES @ ${sharePrice}
              </Button>
              <Button 
                variant="outline"
                className="h-12 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-semibold"
                onClick={() => onQuickTrade(market, "NO")}
              >
                NO @ ${sharePrice}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
