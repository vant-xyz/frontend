"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Market, placeOrder, OrderSide } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const yesPriceCents = market.current_price ?? 50;
  const noPriceCents = Math.max(0, 100 - yesPriceCents);
  const pricePerShare = Math.max(0.01, (selectedSide === "YES" ? yesPriceCents : noPriceCents) / 100);
  const derivedQuantity = inputMode === "shares"
    ? parseFloat(quantity) || 0
    : (parseFloat(usdAmount) || 0) / pricePerShare;
  const numQuantity = Number.isFinite(derivedQuantity) ? derivedQuantity : 0;
  const totalCost = numQuantity * pricePerShare;
  const maxWin = numQuantity * 100;

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
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 text-lg"
                  min="0"
                  step="0.01"
                />
              </>
            ) : (
              <>
                <Label htmlFor="usdAmount" className="text-gray-400">Amount (USD)</Label>
                <Input
                  id="usdAmount"
                  type="number"
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 text-lg"
                  min="0"
                  step="0.01"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Cost</p>
              <p className="text-xl font-mono text-white">${totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Max Win</p>
              <p className={cn("text-xl font-mono", sideColor === "green" ? "text-green-400" : "text-red-400")}>
                ${maxWin.toFixed(2)}
              </p>
            </div>
          </div>

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
