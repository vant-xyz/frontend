"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { withdrawBalance, withdrawAsset } from "@/lib/api";
import { toast } from "sonner";
import { ArrowUpRight, CheckCircle2, Info, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { BalanceInfo } from "@/lib/api";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: BalanceInfo | null;
  isDemoMode: boolean;
  onSuccess: () => void;
}

type Tab = "usd" | "asset";

const REAL_ASSETS = [
  { key: "usdc_sol",  label: "USDC",  network: "Solana", balanceKey: "usdc_sol",  private: true  },
  { key: "usdt_sol",  label: "USDT",  network: "Solana", balanceKey: "usdt_sol",  private: true  },
  { key: "usdg_sol",  label: "USDG",  network: "Solana", balanceKey: "usdg_sol",  private: true  },
  { key: "pusd_sol",  label: "PUSD",  network: "Solana", balanceKey: "pusd_sol",  private: true  },
  { key: "wsol",      label: "WSOL",  network: "Solana", balanceKey: "wsol",      private: true  },
  { key: "sol",       label: "SOL",   network: "Solana", balanceKey: "sol",       private: false },
  { key: "eth_base",  label: "ETH",   network: "Base",   balanceKey: "eth_base",  private: false },
  { key: "usdc_base", label: "USDC",  network: "Base",   balanceKey: "usdc_base", private: false },
] as const;

const DEMO_ASSETS = [
  { key: "demo_sol",      label: "SOL",   network: "Solana (devnet)", balanceKey: "demo_sol",      private: false },
  { key: "demo_usdc_sol", label: "USDC",  network: "Solana (devnet)", balanceKey: "demo_usdc_sol", private: true  },
] as const;

const ALL_ASSETS = [...REAL_ASSETS, ...DEMO_ASSETS];

type AssetKey = typeof REAL_ASSETS[number]["key"] | typeof DEMO_ASSETS[number]["key"];

const PrivacyBadge = ({ isPrivate }: { isPrivate: boolean }) =>
  isPrivate ? (
    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-green-400">
      <img src="/media/images/magicblock-icon.jpg" alt="MagicBlock" className="w-3.5 h-3.5 rounded-full object-cover" />
      Private · MagicBlock
    </span>
  ) : (
    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">
      On-chain transfer
    </span>
  );

export function WithdrawModal({ isOpen, onClose, balance, isDemoMode, onSuccess }: WithdrawModalProps) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>("usd");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>(isDemoMode ? "demo_sol" : "usdc_sol");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ gross: number; fee: number; net: number; label: string } | null>(null);

  const tradingBalance = isDemoMode ? (balance?.demo_naira ?? 0) : (balance?.naira ?? 0);
  const parsedAmount = parseFloat(amount) || 0;
  const isBase = address.toLowerCase().startsWith("0x");
  const activeAssets = isDemoMode ? DEMO_ASSETS : REAL_ASSETS;
  useEffect(() => {
    setSelectedAsset(isDemoMode ? "demo_sol" : "usdc_sol");
    setAmount("");
  }, [isDemoMode]);
  const assetConfig = ALL_ASSETS.find((a) => a.key === selectedAsset)!;
  const assetBalance = balance ? (balance[assetConfig.balanceKey as keyof BalanceInfo] as number ?? 0) : 0;

  const handleReset = () => {
    setAmount("");
    setAddress("");
    setDone(false);
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmitUsd = async () => {
    if (!parsedAmount || parsedAmount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!address.trim()) { toast.error("Enter a destination address"); return; }
    if (parsedAmount > tradingBalance) { toast.error("Amount exceeds available balance"); return; }
    const token = localStorage.getItem("auth_token");
    if (!token) { toast.error("Not authenticated"); return; }
    setSubmitting(true);
    try {
      const res = await withdrawBalance(token, parsedAmount, address.trim(), isDemoMode);
      setResult({ gross: res.gross_amount, fee: res.fee_amount, net: res.net_amount, label: "USDC" });
      setDone(true);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAsset = async () => {
    if (!parsedAmount || parsedAmount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!address.trim()) { toast.error("Enter a destination address"); return; }
    if (parsedAmount > assetBalance) { toast.error("Amount exceeds available balance"); return; }
    const token = localStorage.getItem("auth_token");
    if (!token) { toast.error("Not authenticated"); return; }
    setSubmitting(true);
    try {
      const res = await withdrawAsset(token, selectedAsset, parsedAmount, address.trim());
      setResult({ gross: res.gross_amount, fee: res.fee_amount, net: res.net_amount, label: assetConfig.label });
      setDone(true);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Asset withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const doneView = result && (
    <div className="flex flex-col items-center justify-center py-10 space-y-6">
      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
        <CheckCircle2 size={40} className="text-green-500" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Withdrawal Initiated</h3>
        <p className="text-sm text-gray-400">Funds are on their way to your wallet.</p>
      </div>
      <div className="w-full space-y-2 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
        {[
          ["Amount", `${result.gross.toFixed(result.label === "SOL" || result.label === "ETH" ? 6 : 2)} ${result.label}`],
          ["Network Fee", `${result.fee.toFixed(result.label === "SOL" || result.label === "ETH" ? 6 : 2)} ${result.label}`],
          ["You Receive", `${result.net.toFixed(result.label === "SOL" || result.label === "ETH" ? 6 : 2)} ${result.label}`],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-black text-white">{val}</span>
          </div>
        ))}
      </div>
      <Button onClick={handleClose} className="h-10 px-8 rounded-xl bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest text-[10px] shadow-none">
        Done
      </Button>
    </div>
  );

  const usdTab = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex-1 flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Available</span>
          <span className="text-sm font-black text-white">${tradingBalance.toFixed(2)} USD</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount (USD)</p>
        <div className="flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-white/5 border-white/10 rounded-xl h-12 text-xl font-black text-white px-4"
          />
          <Button
            onClick={() => setAmount(tradingBalance.toFixed(2))}
            className="h-12 px-4 bg-white/8 hover:bg-white/15 text-white font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/10 shadow-none"
          >
            MAX
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Destination Address</p>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Solana address or 0x… for Base"
          className="bg-white/5 border-white/10 rounded-xl h-11 text-white font-mono text-xs px-4"
        />
        {address && (
          <p className="text-[10px] text-gray-500">
            Network: <span className="text-white font-bold">{isBase ? "Base" : "Solana"}</span>
          </p>
        )}
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
        <img src="/media/images/magicblock-icon.jpg" alt="MagicBlock" className="w-5 h-5 rounded-full object-cover mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] text-green-300 font-bold">Private by default · MagicBlock</p>
          <p className="text-[11px] text-green-400/70">
            Sent as USDC via MagicBlock's private payment network — the link between your Vantic vault and destination is broken on-chain.
          </p>
        </div>
      </div>

      <Button
        onClick={handleSubmitUsd}
        disabled={submitting || !parsedAmount || !address}
        className="w-full h-11 rounded-xl bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest text-[10px] shadow-none disabled:opacity-40 gap-2"
      >
        {submitting ? <Loader className="text-black" /> : <><ArrowUpRight size={14} />Withdraw</>}
      </Button>
    </div>
  );

  const assetTab = (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Asset</p>
        <div className="grid grid-cols-2 gap-1.5">
          {activeAssets.map((a) => (
            <button
              key={a.key}
              onClick={() => { setSelectedAsset(a.key); setAmount(""); }}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-xl border text-left transition-all",
                selectedAsset === a.key
                  ? "border-white/20 bg-white/8"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/5"
              )}
            >
              <div>
                <p className="text-xs font-black text-white">{a.label}</p>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{a.network}</p>
              </div>
              {a.private
                ? <img src="/media/images/magicblock-icon.jpg" alt="MagicBlock" className="w-4 h-4 rounded-full object-cover shrink-0" />
                : <ArrowRight size={10} className="text-zinc-600 shrink-0" />
              }
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between px-1 pt-1">
          <PrivacyBadge isPrivate={assetConfig.private} />
          <p className="text-[10px] text-gray-500">
            Balance: <span className="text-white font-bold">{assetBalance.toFixed(assetConfig.key === "sol" || assetConfig.key === "demo_sol" || assetConfig.key === "eth_base" ? 6 : 4)}</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</p>
        <div className="flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-white/5 border-white/10 rounded-xl h-12 text-xl font-black text-white px-4"
          />
          <Button
            onClick={() => setAmount(String(assetBalance))}
            className="h-12 px-4 bg-white/8 hover:bg-white/15 text-white font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/10 shadow-none"
          >
            MAX
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Destination Address</p>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={assetConfig.network === "Base" ? "0x… address" : "Solana address"}
          className="bg-white/5 border-white/10 rounded-xl h-11 text-white font-mono text-xs px-4"
        />
      </div>

      {assetConfig.private ? (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
          <img src="/media/images/magicblock-icon.jpg" alt="MagicBlock" className="w-5 h-5 rounded-full object-cover mt-0.5 shrink-0" />
          <p className="text-[11px] text-green-400">
            SPL transfers are routed through MagicBlock's private payment network — the source is not visible on-chain.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <Info size={13} className="text-gray-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-gray-500">
            {assetConfig.key === "demo_sol"
              ? "Devnet SOL transfer — sent directly on-chain to your devnet wallet."
              : assetConfig.key === "sol"
                ? "SOL transfers are sent directly on-chain. The transaction is publicly visible."
                : "Base transfers are sent directly on-chain. The transaction is publicly visible."}
          </p>
        </div>
      )}

      <Button
        onClick={handleSubmitAsset}
        disabled={submitting || !parsedAmount || !address}
        className="w-full h-11 rounded-xl bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest text-[10px] shadow-none disabled:opacity-40 gap-2"
      >
        {submitting ? <Loader className="text-black" /> : <><ArrowUpRight size={14} />Withdraw {assetConfig.label}</>}
      </Button>
    </div>
  );

  const inner = (
    <div className="py-4">
      {done ? doneView : (
        <>
          <div className="flex gap-1 mb-5 p-1 bg-white/[0.03] rounded-xl border border-white/5">
            {(["usd", "asset"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); handleReset(); }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  tab === t ? "bg-white text-black" : "text-gray-500 hover:text-white"
                )}
              >
                {t === "usd" ? "USD Balance" : "Crypto Asset"}
              </button>
            ))}
          </div>
          {tab === "usd" ? usdTab : assetTab}
        </>
      )}
    </div>
  );

  const title = done ? "Withdrawal Complete" : "Withdraw";

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="bg-black border-white/10 px-4 pb-8 max-h-[95vh] outline-none">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle className="text-xl font-black text-white uppercase tracking-tight">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">{inner}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-black border-white/10 p-8 rounded-3xl shadow-2xl outline-none border max-h-[90vh] flex flex-col">
        <DialogHeader className="text-left p-0 mb-2 shrink-0">
          <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1">{inner}</div>
      </DialogContent>
    </Dialog>
  );
}
