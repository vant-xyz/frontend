"use client";

import { useState, useEffect, useRef } from "react";
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
  marketTitle,
  onConfirm,
  confirming,
}: {
  open: boolean;
  onClose: () => void;
  preview: OrderPreview;
  side: "YES" | "NO";
  marketTitle: string;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const depositAmt  = preview.depositAmount / Math.pow(10, USDC_DECIMALS);
  const payoutAmt   = Number(preview.newPayoutUsd) / 1_000_000;
  const profit      = payoutAmt - depositAmt;
  const roiPct      = depositAmt > 0 ? (profit / depositAmt) * 100 : 0;
  const vanticFeeUsd = (preview.vanticFeeAmount / Math.pow(10, USDC_DECIMALS)).toFixed(4);
  const jupFeeUsd    = microUsdToDisplay(preview.estimatedJupiterFeeUsd);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0d0505] border border-white/10 text-white max-w-sm p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Confirm Order</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-500 mt-1 truncate">{marketTitle}</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Side badge + paying */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-3 py-1 rounded-[6px] text-xs font-bold border",
                side === "YES"
                  ? "bg-green-500/15 border-green-500/30 text-green-400"
                  : "bg-red-500/15 border-red-500/30 text-red-400"
              )}>
                {side}
              </span>
              <span className="text-xs text-zinc-500">outcome</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">You pay</p>
              <p className="text-lg font-black text-white tabular-nums">${depositAmt.toFixed(2)}</p>
            </div>
          </div>

          {/* Payout highlight */}
          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.07] p-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Potential payout</p>
                <p className="text-3xl font-black text-white tabular-nums">${payoutAmt.toFixed(2)}</p>
              </div>
              <div className="text-right pb-0.5">
                <span className="text-green-400 font-bold text-sm">+{roiPct.toFixed(0)}%</span>
                <p className="text-[10px] text-zinc-600 mt-0.5">return</p>
              </div>
            </div>
            <div className="mt-3 h-px w-full bg-white/[0.05]" />
            <p className="text-xs text-zinc-500 mt-3">
              Profit if {side} wins: <span className="text-green-400 font-semibold">${profit.toFixed(2)}</span>
            </p>
          </div>

          {/* Fee breakdown */}
          <div className="space-y-2 text-xs">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Fees</p>
            <div className="flex justify-between text-zinc-400">
              <span>Jupiter protocol fee</span>
              <span>{jupFeeUsd}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Vantic fee (0.5%)</span>
              <span>${vanticFeeUsd}</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-700 flex items-start gap-1">
            <Info size={10} className="mt-0.5 shrink-0" />
            Estimates only. Final fill depends on orderbook at execution.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-6 pb-6">
          <button
            className="flex-1 py-2.5 rounded-[10px] border border-white/10 text-zinc-400 text-sm font-semibold hover:text-white transition"
            onClick={onClose}
            disabled={confirming}
          >
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
  marketTitle?: string;
}

export function TradePanel({ market, marketTitle }: TradePanelProps) {
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

  // One idempotency key per order intent. It regenerates whenever the order
  // parameters change, so changing side/amount/market starts a new order, but
  // repeated clicks on the same parameters dedupe to a single built order.
  const idemKeyRef = useRef<string>("");
  useEffect(() => {
    idemKeyRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${market.marketId}-${side}-${amountUsd}-${Date.now()}`;
  }, [side, amountUsd, market.marketId]);

  const pricing = market.pricing;
  const price = side === "YES" ? pricing?.buyYesPriceUsd : pricing?.buyNoPriceUsd;
  const priceDisplay = price != null ? `${Math.round(price / 10_000)}¢` : "—";

  const depositAmount = Math.round(parseFloat(amountUsd || "0") * Math.pow(10, USDC_DECIMALS));

  const handlePreview = async () => {
    if (!token) {
      toast.error("Connect your wallet to trade");
      return;
    }
    if (depositAmount <= 0) {
      toast.error("Enter an amount");
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
        token,
        idemKeyRef.current
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
          className="w-full py-2.5 px-4 rounded-[10px] text-sm"
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
              min="0"
              step="any"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-[10px] pl-7 pr-16 py-3 text-white text-sm font-semibold focus:outline-none focus:border-white/25 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00"
              disabled={isDisabled}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/images/token_icons/usdc.png" alt="USDC" className="w-4 h-4 rounded-full" />
              <span className="text-xs text-zinc-500 font-semibold">USDC</span>
            </span>
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

        {/* Inline order estimate */}
        {price != null && amountUsd && parseFloat(amountUsd) > 0 && (() => {
          const amt = parseFloat(amountUsd);
          const priceCents = Math.round(price / 10_000);
          if (priceCents <= 0) return null;
          const shares = amt * (100 / priceCents); // contracts; each pays out $1
          const payout = shares;                   // max payout = shares × $1
          const profit = payout - amt;
          const roi    = (profit / amt) * 100;
          return (
            <div className="rounded-[10px] bg-white/[0.02] border border-white/[0.06] divide-y divide-white/[0.05]">
              {/* What you're buying */}
              <div className="px-4 py-2.5 flex items-center justify-between">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">You&apos;re buying</p>
                <p className="text-sm font-bold text-white tabular-nums">
                  {shares.toFixed(2)} <span className="text-zinc-500 font-medium">{side} shares</span>
                  <span className="text-zinc-600 font-medium"> @ {priceCents}¢</span>
                </p>
              </div>
              {/* Payout + return */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">Potential payout</p>
                  <p className="text-sm font-bold text-white tabular-nums">${payout.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">Return</p>
                  <p className="text-sm font-bold text-green-400 tabular-nums">+{roi.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* CTA */}
        <GlowButton
          onClick={handlePreview}
          disabled={loading || isDisabled || !amountUsd || parseFloat(amountUsd) <= 0}
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
          marketTitle={marketTitle ?? market.title}
          onConfirm={handleConfirm}
          confirming={confirming}
        />
      )}
    </>
  );
}
