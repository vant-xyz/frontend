"use client";

import { useEffect, useState } from "react";
import { Market, OrderSide, getOrderbook, getMarketVolume, PriceData } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Share2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickTradeModal } from "./quick-trade-modal";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export interface MarketsListProps {
  loading: boolean;
  error: string | null;
  markets: Market[];
  reloadMarkets: () => Promise<void>;
  prices?: PriceData & { vant_rate: number | null };
}

export function MarketsList({ loading, error, reloadMarkets, markets, prices }: MarketsListProps) {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedSide, setSelectedSide] = useState<OrderSide>("YES");
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);

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
        <Button variant="outline" onClick={() => reloadMarkets()} className="mt-4">
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
          <MarketCard key={market.id} market={market} onQuickTrade={handleQuickTrade} prices={prices} />
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

export interface MarketCardProps {
  market: Market;
  onQuickTrade: (market: Market, side: OrderSide) => void;
  prices?: PriceData & { vant_rate: number | null };
}

export function MarketCard({ market, onQuickTrade, prices }: MarketCardProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<{ seconds: number; text: string }>({ seconds: 0, text: "" });
  const [shareOpen, setShareOpen] = useState(false);
  const [yesNoCents, setYesNoCents] = useState<{ yes: number; no: number }>({ yes: 50, no: 50 });
  const [volumeUsd, setVolumeUsd] = useState(0);

  const toCents = (v?: number) => {
    const n = Number(v ?? 0);
    if (!Number.isFinite(n)) return 0;
    return n <= 1 ? n * 100 : n;
  };

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
          text: `${minutes}:${seconds.toString().padStart(2, "0")}`,
        });
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [market.end_time_utc]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const ob = await getOrderbook(market.id);
        const bestYesBid = toCents(ob.orderbook?.yes_bids?.[0]?.price);
        const bestNoAsk = toCents(ob.orderbook?.no_asks?.[0]?.price);
        const yes = bestYesBid > 0 ? bestYesBid : toCents(ob.orderbook?.last_traded_price) || 50;
        const no = bestNoAsk > 0 ? bestNoAsk : Math.max(0, 100 - yes);
        if (active) setYesNoCents({ yes, no });
      } catch {
        if (active) setYesNoCents({ yes: 50, no: 50 });
      }
      try {
        const vol = await getMarketVolume(market.id);
        if (active) setVolumeUsd(Number(vol.volume?.volume ?? 0));
      } catch {
        if (active) setVolumeUsd(0);
      }
    };
    load();
    const i = setInterval(load, 1000);
    return () => {
      active = false;
      clearInterval(i);
    };
  }, [market.id]);

  const openDetails = () => router.push(`/market/${market.id}`);

  const liveSpot = (() => {
    const asset = (market.asset || "").toUpperCase() as keyof PriceData;
    const p = prices?.[asset];
    const n = p?.price ? Number(p.price) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const currentPriceDollars = liveSpot ?? (market.current_price ?? 50) / 100;
  const targetPrice = market.target_price ? (market.target_price / 100).toFixed(2) : "0.00";
  const yesPriceCents = yesNoCents.yes;
  const noPriceCents = yesNoCents.no;
  const isSettling = timeLeft.seconds <= 0;

  const avatarSrc = `/media/images/crypto_assets/${(market.asset || "BTC").toLowerCase()}.png`;
  const bgImage = market.market_image_small || avatarSrc;
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://vantic.xyz"}/market/${market.id}`;
  const previewImageUrl = `${typeof window !== "undefined" ? window.location.origin : "https://vantic.xyz"}/app/general/${market.id}/opengraph-image`;

  return (
    <>
      <Card className="relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all group cursor-pointer" onClick={openDetails}>
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "180px",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right -22px top -10px",
            transform: "rotate(-8deg)",
            transformOrigin: "top right",
          }}
        />
        <CardContent className="relative pt-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={avatarSrc} alt={market.asset || "asset"} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
              <div>
                <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">{market.title}</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn("flex items-center gap-1 font-mono", timeLeft.seconds <= 20 && timeLeft.seconds > 0 ? "text-red-400" : "text-gray-400")}>
                    <Clock size={12} />
                    {timeLeft.text}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-400">{market.market_type}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("border-green-500/50 text-green-400", isSettling && "border-yellow-500/50 text-yellow-400")}>
                {isSettling ? "Settling" : "Active"}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShareOpen(true);
                }}
              >
                <Share2 size={16} />
              </Button>
            </div>
          </div>

          <p className="text-sm text-gray-400 line-clamp-2">{market.description}</p>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Current Price</p>
                  <p className="text-lg font-mono text-white">${currentPriceDollars.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Target</p>
                  <p className="text-lg font-mono text-white flex items-center gap-2">
                    <Target size={16} className={market.direction === "Above" ? "text-green-400" : "text-red-400"} />
                    ${targetPrice}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Volume</p>
                  <p className="text-lg font-mono text-white">${volumeUsd.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {isSettling ? (
              <div className="py-4 text-center flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 text-yellow-400" />
                <p className="text-yellow-400 font-semibold animate-pulse">Settling...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  className="h-12 border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300 font-semibold"
                  onClick={() => onQuickTrade(market, "YES")}
                >
                  YES @ {yesPriceCents.toFixed(1)}¢
                </Button>
                <Button
                  variant="outline"
                  className="h-12 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-semibold"
                  onClick={() => onQuickTrade(market, "NO")}
                >
                  NO @ {noPriceCents.toFixed(1)}¢
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="bg-black border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Share Market</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-white/10">
              <img
                src={previewImageUrl}
                alt={`${market.title} preview`}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = market.market_image_small || `/media/images/crypto_assets/${(market.asset || "btc").toLowerCase()}.png`;
                }}
              />
            </div>
            <p className="text-xs text-gray-400">{shareUrl}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied");
                  } catch {
                    toast.error("Failed to copy link");
                  }
                }}
              >
                Copy Link
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    if (navigator.share) {
                      await navigator.share({ title: market.title, text: market.description, url: shareUrl });
                    } else {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copied");
                    }
                  } catch {
                    // no-op
                  }
                }}
              >
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
