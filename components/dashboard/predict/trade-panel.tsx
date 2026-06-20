"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction, Transaction } from "@solana/web3.js";
import { toast } from "sonner";
import { Loader2, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createOrder, submitSignedTransaction, Market, OrderPreview } from "@/lib/api";
import { useV2Auth } from "@/hooks/use-v2-auth";
import { ConnectWalletButton } from "@/components/auth/connect-wallet-button";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDC_DECIMALS = 6;

function microUsdToDisplay(microUsd: string | undefined): string {
  if (!microUsd) return "$0.00";
  return `$${(Number(microUsd) / 1_000_000).toFixed(2)}`;
}

function feeAmountToDisplay(feeAmount: number): string {
  return `$${(feeAmount / Math.pow(10, USDC_DECIMALS)).toFixed(4)}`;
}

function PreviewModal({
  open,
  onClose,
  preview,
  side,
  onConfirm,
  confirming,
}: {
  open: boolean;
  onClose: () => void;
  preview: OrderPreview;
  side: "YES" | "NO";
  onConfirm: () => void;
  confirming: boolean;
}) {
  const depositUsd = (preview.depositAmount / Math.pow(10, USDC_DECIMALS)).toFixed(2);
  const vanticFeeUsd = (preview.vanticFeeAmount / Math.pow(10, USDC_DECIMALS)).toFixed(4);
  const jupFeeUsd = microUsdToDisplay(preview.estimatedJupiterFeeUsd);
  const potentialWin = microUsdToDisplay(preview.newPayoutUsd);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-zinc-950 border border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Order Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Side</span>
            <span className={cn("font-semibold", side === "YES" ? "text-green-400" : "text-red-400")}>
              {side}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Deposit</span>
            <span className="text-white">${depositUsd} USDC</span>
          </div>

          <div className="border-t border-white/5 pt-3 space-y-2">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Fees</p>
            <div className="flex justify-between">
              <span className="text-zinc-400">Jupiter protocol fee</span>
              <span className="text-zinc-300">{jupFeeUsd}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Vantic fee (0.5%)</span>
              <span className="text-zinc-300">${vanticFeeUsd}</span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 flex justify-between font-semibold">
            <span className="text-zinc-300">Potential win</span>
            <span className="text-white">{potentialWin}</span>
          </div>

          <p className="text-[10px] text-zinc-600 flex items-start gap-1 pt-1">
            <Info size={10} className="mt-0.5 shrink-0" />
            Prices are estimates. Final fill depends on orderbook at time of execution.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 border-white/10 text-zinc-400" onClick={onClose} disabled={confirming}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? <Loader2 size={16} className="animate-spin" /> : "Confirm & Sign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TradePanelProps {
  market: Market;
}

export function TradePanel({ market }: TradePanelProps) {
  const { token, isV2 } = useV2Auth();
  const { signTransaction, connected } = useWallet();

  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amountUsd, setAmountUsd] = useState("10");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const pricing = market.pricing;
  const price = side === "YES" ? pricing?.buyYesPriceUsd : pricing?.buyNoPriceUsd;
  const priceDisplay = price != null ? `${Math.round(price * 100)}¢` : "—";

  const depositAmount = Math.round(parseFloat(amountUsd || "0") * Math.pow(10, USDC_DECIMALS));

  const handlePreview = async () => {
    if (!token || depositAmount < 5_000_000) {
      toast.error("Minimum order is $5 USDC");
      return;
    }
    setLoading(true);
    try {
      const res = await createOrder(
        {
          marketId: market.marketId,
          isYes: side === "YES",
          isBuy: true,
          depositAmount,
          depositMint: USDC_MINT,
        },
        token
      );
      setPendingTx(res.transaction);
      setPreview(res.preview);
      setShowPreview(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to build order");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingTx || !signTransaction) return;
    setConfirming(true);
    try {
      const txBytes = Buffer.from(pendingTx, "base64");

      // Try versioned first (Jupiter returns v0), fall back to legacy
      let signed: Uint8Array;
      try {
        const vtx = VersionedTransaction.deserialize(txBytes);
        const signedVtx = await signTransaction(vtx as any);
        signed = (signedVtx as VersionedTransaction).serialize();
      } catch {
        const ltx = Transaction.from(txBytes);
        const signedLtx = await signTransaction(ltx as any);
        signed = (signedLtx as Transaction).serialize();
      }

      const signedBase64 = Buffer.from(signed).toString("base64");
      const { signature } = await submitSignedTransaction(signedBase64);

      setShowPreview(false);
      setPendingTx(null);
      toast.success(`Order placed! Tx: ${signature.slice(0, 8)}…`);
    } catch (err: any) {
      toast.error(err?.message || "Transaction failed");
    } finally {
      setConfirming(false);
    }
  };

  if (!isV2 || !connected) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <p className="text-sm text-zinc-400 text-center">Connect your wallet to trade</p>
        <ConnectWalletButton
          className="w-full py-2.5 px-4 bg-white text-black font-semibold rounded-lg hover:bg-zinc-100 transition-colors text-sm"
          onAuthSuccess={() => window.location.reload()}
        />
      </div>
    );
  }

  const isDisabled = market.status !== "open";

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Place Order</h3>

        {/* Side selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSide("YES")}
            className={cn(
              "py-2.5 rounded-lg text-sm font-semibold border transition",
              side === "YES"
                ? "bg-green-500/15 border-green-500/50 text-green-400"
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
            )}
          >
            YES · {pricing?.buyYesPriceUsd != null ? `${Math.round(pricing.buyYesPriceUsd * 100)}¢` : "—"}
          </button>
          <button
            onClick={() => setSide("NO")}
            className={cn(
              "py-2.5 rounded-lg text-sm font-semibold border transition",
              side === "NO"
                ? "bg-red-500/15 border-red-500/50 text-red-400"
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
            )}
          >
            NO · {pricing?.buyNoPriceUsd != null ? `${Math.round(pricing.buyNoPriceUsd * 100)}¢` : "—"}
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500">Amount (USDC)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
            <input
              type="number"
              min="5"
              step="1"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition"
              placeholder="10"
              disabled={isDisabled}
            />
          </div>
          <div className="flex gap-1.5">
            {["5", "10", "25", "50"].map((v) => (
              <button
                key={v}
                onClick={() => setAmountUsd(v)}
                className="px-2.5 py-1 rounded text-[11px] bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                ${v}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full bg-white text-black hover:bg-zinc-200 font-bold"
          onClick={handlePreview}
          disabled={loading || isDisabled || !amountUsd || parseFloat(amountUsd) < 5}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Preview {side} Order <ArrowRight size={14} className="ml-1" />
            </>
          )}
        </Button>

        {isDisabled && (
          <p className="text-xs text-zinc-600 text-center">Market is {market.status}</p>
        )}
      </div>

      {preview && (
        <PreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          preview={preview}
          side={side}
          onConfirm={handleConfirm}
          confirming={confirming}
        />
      )}
    </>
  );
}
