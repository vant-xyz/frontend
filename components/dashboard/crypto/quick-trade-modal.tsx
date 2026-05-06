"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Market, placeOrder, OrderSide, getOrderbook, getBalance } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

interface QuickTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market;
  selectedSide: OrderSide;
}

export function QuickTradeModal({
  isOpen,
  onClose,
  market,
  selectedSide,
}: QuickTradeModalProps) {
  const [quantity, setQuantity] = useState<string>("10");
  const [inputMode, setInputMode] = useState<"shares" | "usd">("shares");
  const [usdAmount, setUsdAmount] = useState<string>("100");
  const [submitting, setSubmitting] = useState(false);
  const isDemoMode = typeof window !== "undefined" ? localStorage.getItem("mode") === "demo" : false;

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const [quoteCents, setQuoteCents] = useState<{ yes: number; no: number }>({ yes: 50, no: 50 });
  const [tradingBalance, setTradingBalance] = useState(0);
  const [cumulativeAssetUsd, setCumulativeAssetUsd] = useState(0);

  const toCents = (v?: number) => {
    const n = Number(v ?? 0);
    if (!Number.isFinite(n)) return 0;
    return n <= 1 ? n * 100 : n;
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const ob = await getOrderbook(market.id);
        const yes = toCents(ob.orderbook?.yes_bids?.[0]?.price) || toCents(ob.orderbook?.last_traded_price) || 50;
        const no = toCents(ob.orderbook?.no_asks?.[0]?.price) || Math.max(0, 100 - yes);
        if (active) setQuoteCents({ yes, no });
      } catch {
        if (active) setQuoteCents({ yes: 50, no: 50 });
      }
    };
    load();
    const i = setInterval(load, 1000);
    return () => {
      active = false;
      clearInterval(i);
    };
  }, [market.id]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const loadBalance = async () => {
      try {
        const res = await getBalance(token);
        const b = isDemoMode ? (res.balance?.demo_naira ?? 0) : (res.balance?.naira ?? 0);
        const assets = isDemoMode ? (res.balance?.total_demo_usd ?? 0) : (res.balance?.total_usd ?? 0);
        if (active) setTradingBalance(Number(b) || 0);
        if (active) setCumulativeAssetUsd(Number(assets) || 0);
      } catch {
        if (active) setTradingBalance(0);
        if (active) setCumulativeAssetUsd(0);
      }
    };
    loadBalance();
    const i = setInterval(loadBalance, 1000);
    return () => {
      active = false;
      clearInterval(i);
    };
  }, [token, isDemoMode]);

  const yesPriceCents = quoteCents.yes;
  const noPriceCents = quoteCents.no;
  const pricePerShare = Math.max(0.01, (selectedSide === "YES" ? yesPriceCents : noPriceCents) / 100);
  const derivedQuantity = inputMode === "shares"
    ? parseFloat(quantity) || 0
    : (parseFloat(usdAmount) || 0) / pricePerShare;
  const numQuantity = Number.isFinite(derivedQuantity) ? derivedQuantity : 0;
  const totalCost = numQuantity * pricePerShare;
  const maxWin = numQuantity * 1.0;

  const applyPreset = (ratio: number) => {
    if (pricePerShare <= 0) return;
    const maxAffordable = Math.max(0, Math.floor(tradingBalance / pricePerShare));
    const q = ratio >= 1 ? maxAffordable : Math.floor(maxAffordable * ratio);
    if (inputMode === "shares") {
      setQuantity(String(q));
    } else {
      setUsdAmount((q * pricePerShare).toFixed(2));
    }
  };

  const handlePlaceOrder = async () => {
    if (!token) {
      toast.error("Please login to trade");
      return;
    }

    if (numQuantity <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    try {
      setSubmitting(true);
      await placeOrder(token, {
        market_id: market.id,
        side: selectedSide,
        type: "MARKET",
        quantity: numQuantity,
        is_demo: isDemoMode,
      });
      
      toast.success(`Successfully bought ${selectedSide} shares!`);
      setQuantity("10");
      setUsdAmount("100");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const sideColor = selectedSide === "YES" ? "green" : "red";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Quick Buy {selectedSide} Shares
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center p-4 bg-white/5 rounded-xl">
            <p className="text-gray-400 text-sm mb-1">{market.title}</p>
            <p className="text-2xl font-bold text-white">{market.asset} {market.direction} ${market.target_price ? (market.target_price / 100).toFixed(2) : "0.00"}</p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant={inputMode === "shares" ? "default" : "outline"} onClick={() => setInputMode("shares")}>By Shares</Button>
              <Button variant={inputMode === "usd" ? "default" : "outline"} onClick={() => setInputMode("usd")}>By Dollars</Button>
            </div>
            {inputMode === "shares" ? (
              <>
                <Label htmlFor="quantity" className="text-gray-400">Quantity (shares)</Label>
                <div className="flex items-stretch gap-1">
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-12 text-lg"
                    min="0"
                    step="0.01"
                  />
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => setQuantity(String(Math.max(0, (parseFloat(quantity) || 0) + 1)))}
                      className="flex-1 w-8 rounded-md bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(String(Math.max(0, (parseFloat(quantity) || 0) - 1)))}
                      className="flex-1 w-8 rounded-md bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Label htmlFor="usdAmount" className="text-gray-400">Amount (USD)</Label>
                <div className="flex items-stretch gap-1">
                  <Input
                    id="usdAmount"
                    type="number"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-12 text-lg"
                    min="0"
                    step="0.01"
                  />
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => setUsdAmount((Math.max(0, (parseFloat(usdAmount) || 0) + 1)).toFixed(2))}
                      className="flex-1 w-8 rounded-md bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsdAmount((Math.max(0, (parseFloat(usdAmount) || 0) - 1)).toFixed(2))}
                      className="flex-1 w-8 rounded-md bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              </>
            )}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(0.25)}
                className="flex-1 py-1.5 text-[10px] font-semibold border border-white/10 rounded-lg text-gray-400 hover:border-white/25 hover:text-gray-200 transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0.5)}
                className="flex-1 py-1.5 text-[10px] font-semibold border border-white/10 rounded-lg text-gray-400 hover:border-white/25 hover:text-gray-200 transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => applyPreset(1)}
                className="flex-1 py-1.5 text-[10px] font-semibold border border-white/10 rounded-lg text-gray-400 hover:border-white/25 hover:text-gray-200 transition-colors"
              >
                MAX
              </button>
            </div>
            <p className="text-[10px] text-gray-500">
              Balance ${tradingBalance.toFixed(2)} (${cumulativeAssetUsd.toFixed(2)} assets)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Cost</p>
              <p className="text-xl font-mono text-white">${totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">You'll Receive</p>
              <p className={cn("text-xl font-mono", sideColor === "green" ? "text-green-400" : "text-red-400")}>
                ${maxWin.toFixed(2)}
              </p>
            </div>
          </div>
          {inputMode === "usd" && (
            <p className="text-xs text-gray-400">
              Calculated shares: <span className="text-white font-mono">{numQuantity.toFixed(4)}</span>
            </p>
          )}

          <Button
            className={cn(
              "w-full h-14 text-lg font-semibold",
              selectedSide === "YES" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"
            )}
            onClick={handlePlaceOrder}
            disabled={submitting || numQuantity <= 0}
          >
            {submitting ? "Placing Order..." : `Buy ${selectedSide} @ $${pricePerShare.toFixed(3)}/share`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
