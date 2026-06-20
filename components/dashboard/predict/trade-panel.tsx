"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction, Transaction } from "@solana/web3.js";
import { toast } from "sonner";
import { Loader2, ArrowRight, Info } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
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
          <button className="flex-1 py-2.5 rounded-[10px] border border-white/10 text-zinc-400 text-sm font-semibold hover:text-white transition" onClick={onClose} disabled={confirming}>
            Cancel
          </button>
          <GlowButton onClick={onConfirm} disabled={confirming} size="sm" className="flex-1">
            {confirming ? <Loader2 size={15} className="animate-spin" /> : "Confirm & Sign"}
          </GlowButton>
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pricing = market.pricing;
  const price = side === "YES" ? pricing?.buyYesPriceUsd : pricing?.buyNoPriceUsd;
  const priceDisplay = price != null ? `${Math.round(price / 10_000)}¢` : "—";

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

  // Don't flash the connect prompt during SSR hydration — wait for localStorage read
  if (!mounted) return null;

  if (!isV2) {
    return (
      <div className="space-y-3 py-2">
        <p className="text-sm text-zinc-400 text-center">Connect your wallet to trade</p>
        <ConnectWalletButton
          className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-[10px] transition-colors text-sm shadow-lg shadow-red-950/40"
          onAuthSuccess={() => window.location.reload()}
        />
      </div>
    );
  }

  const isDisabled = market.status !== "open";

  return (
    <>
      <div className="space-y-4">
        {/* Side selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSide("YES")}
            className={cn(
              "py-3 rounded-[10px] text-sm font-bold border transition-all",
              side === "YES"
                ? "bg-green-500/15 border-green-500/40 text-green-400 shadow-sm shadow-green-950/30"
                : "bg-white/[0.03] border-white/10 text-zinc-500 hover:text-white hover:border-white/20"
            )}
          >
            YES · {pricing?.buyYesPriceUsd != null ? `${Math.round(pricing.buyYesPriceUsd / 10_000)}¢` : "—"}
          </button>
          <button
            onClick={() => setSide("NO")}
            className={cn(
              "py-3 rounded-[10px] text-sm font-bold border transition-all",
              side === "NO"
                ? "bg-red-500/15 border-red-500/40 text-red-400 shadow-sm shadow-red-950/30"
                : "bg-white/[0.03] border-white/10 text-zinc-500 hover:text-white hover:border-white/20"
            )}
          >
            NO · {pricing?.buyNoPriceUsd != null ? `${Math.round(pricing.buyNoPriceUsd / 10_000)}¢` : "—"}
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">You&apos;re paying</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">$</span>
            <input
              type="number"
              min="5"
              step="1"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-[10px] pl-7 pr-16 py-3 text-white text-sm font-semibold focus:outline-none focus:border-white/25 transition"
              placeholder="0.00"
              disabled={isDisabled}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-semibold">USDC</span>
          </div>
          <div className="flex gap-1.5">
            {["5", "10", "25", "50"].map((v) => (
              <button
                key={v}
                onClick={() => setAmountUsd(v)}
                className="flex-1 py-1.5 rounded-[7px] text-[11px] font-semibold bg-white/[0.04] border border-white/8 text-zinc-500 hover:text-white hover:border-white/15 transition"
              >
                ${v}
              </button>
            ))}
          </div>
        </div>

        {/* Odds line */}
        {price != null && (
          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <span>Odds</span>
            <span className="text-white font-semibold">{Math.round(price / 10_000)}% chance</span>
          </div>
        )}

        {/* CTA */}
        <GlowButton
          onClick={handlePreview}
          disabled={loading || isDisabled || !amountUsd || parseFloat(amountUsd) < 5}
          className="w-full"
          size="md"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>Place {side} Order <ArrowRight size={14} /></>
          )}
        </GlowButton>

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
