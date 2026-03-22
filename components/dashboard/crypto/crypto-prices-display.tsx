"use client";

import { useEffect, useState, useRef } from "react";
import { ReelAnimation } from "@/components/landing/reel-animation";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface PriceUpdate {
  symbol: string;
  price: string;
  time: number;
}

interface CryptoPriceCardProps {
  symbol: string;
  name: string;
  priceData: PriceUpdate | null;
}

export function CryptoPriceCard({ symbol, name, priceData }: CryptoPriceCardProps) {
  const [direction, setDirection] = useState<"up" | "down" | "neutral">("neutral");
  const [displayPrice, setDisplayPrice] = useState("0.00");
  const [lastPrice, setLastPrice] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const previousPriceRef = useRef<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (!priceData?.price) return;

    const currentPrice = parseFloat(priceData.price);
    const prevPrice = previousPriceRef.current ? parseFloat(previousPriceRef.current) : null;

    if (prevPrice !== null) {
      if (currentPrice > prevPrice) {
        setDirection("up");
      } else if (currentPrice < prevPrice) {
        setDirection("down");
      } else {
        setDirection("neutral");
      }
    }

    if (previousPriceRef.current && previousPriceRef.current !== priceData.price) {
      setLastPrice(previousPriceRef.current);
    }
    
    previousPriceRef.current = priceData.price;
    setDisplayPrice(priceData.price);
  }, [priceData?.price]);

  const textColor = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-white",
  };

  const cleanPrice = displayPrice.replace(/^-/, '');
  const cleanLastPrice = lastPrice ? lastPrice.replace(/^-/, '') : null;

  return (
    <>
      <div className="relative flex flex-col items-center justify-center p-6 rounded-xl border bg-white/5 border-white/10 overflow-hidden">
        {/* Faded Logo Background - Top Right Corner, Tilted */}
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform rotate-12 translate-x-8 -translate-y-8">
          <img
            src={`/media/images/crypto_assets/${symbol.toLowerCase()}.png`}
            alt={symbol}
            className="w-24 h-24"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3">
            <img
              src={`/media/images/crypto_assets/${symbol.toLowerCase()}.png`}
              alt={symbol}
              className="w-8 h-8"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <ReelAnimation
              text={`$${cleanPrice}`}
              className={cn("text-[16px] font-mono font-bold", textColor[direction])}
              rotateInterval={1000}
            />
          </div>

          {cleanLastPrice && (
            <p className="text-xs text-gray-500">
              <span className="font-mono">${cleanLastPrice}</span>
            </p>
          )}
        </div>

        {/* Help Icon */}
        <button
          onClick={() => setShowInfo(true)}
          className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      {/* Info Modal/Drawer */}
      {isDesktop ? (
        <Dialog open={showInfo} onOpenChange={setShowInfo}>
          <DialogContent className="bg-black border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">
                About {name} Price
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={`/media/images/crypto_assets/${symbol.toLowerCase()}.png`}
                  alt={symbol}
                  className="w-10 h-10"
                />
                <div>
                  <p className="font-semibold">{symbol} Spot Price</p>
                  <p className="text-sm text-gray-400">Real-time USD price</p>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                This is the current spot price at which {name} ({symbol}) is traded on the global market. 
                Prices are sourced from <span className="text-white font-semibold">Coinbase</span>, 
                one of the world's largest and most trusted cryptocurrency exchanges.
              </p>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  Data Provider: <span className="text-gray-300">Coinbase API</span>
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showInfo} onOpenChange={setShowInfo}>
          <DrawerContent className="bg-black border-white/10 text-white">
            <DrawerHeader>
              <DrawerTitle className="text-lg">
                About {name} Price
              </DrawerTitle>
            </DrawerHeader>
            <div className="space-y-4 p-4 pb-8">
              <div className="flex items-center gap-3">
                <img
                  src={`/media/images/crypto_assets/${symbol.toLowerCase()}.png`}
                  alt={symbol}
                  className="w-10 h-10"
                />
                <div>
                  <p className="font-semibold">{symbol} Spot Price</p>
                  <p className="text-sm text-gray-400">Real-time USD price</p>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                This is the current spot price at which {name} ({symbol}) is traded on the global market. 
                Prices are sourced from <span className="text-white font-semibold">Coinbase</span>, 
                one of the world's largest and most trusted cryptocurrency exchanges.
              </p>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  Data Provider: <span className="text-gray-300">Coinbase API</span>
                </p>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

interface CryptoPricesDisplayProps {
  prices: {
    BTC: PriceUpdate | null;
    ETH: PriceUpdate | null;
    SOL: PriceUpdate | null;
  };
}

export function CryptoPricesDisplay({ prices }: CryptoPricesDisplayProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <CryptoPriceCard
        symbol="BTC"
        name="Bitcoin"
        priceData={prices.BTC}
      />
      <CryptoPriceCard
        symbol="ETH"
        name="Ethereum"
        priceData={prices.ETH}
      />
      <CryptoPriceCard
        symbol="SOL"
        name="Solana"
        priceData={prices.SOL}
      />
    </div>
  );
}
