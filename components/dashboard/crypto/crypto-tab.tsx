"use client";

import { useState } from "react";
import { Market } from "@/lib/api";
import { MarketsList } from "./markets-list";
import { MarketDetailView } from "./market-detail";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { CryptoPricesDisplay } from "./crypto-prices-display";
import { usePriceFeed } from "@/hooks/use-price-feed";
import { ReelAnimation } from "@/components/landing/reel-animation";

export function CryptoTab() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const { prices } = usePriceFeed({ usePolling: true, pollingInterval: 2000 });

  if (selectedMarket) {
    return (
      <MarketDetailView
        market={selectedMarket}
        onBack={() => setSelectedMarket(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Crypto Prediction Markets</h1>
        <p className="text-gray-400">
          Trade on the future price of{" "}
          <ReelAnimation 
            texts={["BTC", "ETH", "SOL"]}
            className="text-white font-bold"
            rotateInterval={2000}
          />
          .
        </p>
      </div>

      {/* Live Prices */}
      <CryptoPricesDisplay prices={prices} />

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
              <li>Each share pays <strong className="text-white">~₦100</strong> if correct, ~₦0 if wrong</li>
              <li>Markets auto-settle at expiry and can be verified via <a href="/explorer" class="text-red-400 underline">Onchain Verifiable Markets (OVM)</a></li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Markets List */}
      <MarketsList onMarketSelect={setSelectedMarket} />
    </div>
  );
}
