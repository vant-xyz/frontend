"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DemoRealToggle } from "./demo-real-toggle";
import { SellCryptoModal } from "./sell-crypto-modal";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import type { BalanceInfo } from "@/lib/api";
import { Fuel, Copy, ExternalLink, ArrowDownLeft, Landmark, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: BalanceInfo | null;
  isDemoMode: boolean;
  onToggle: () => void;
  onSync: () => void;
  onFundDemo: (amount: number) => Promise<any>;
  onOpenSell: () => void;
  onOpenPrivateDeposit: () => void;
  isSyncing: boolean;
}

interface AssetConfig {
  key: keyof BalanceInfo;
  label: string;
  symbol: string;
  icon?: string;
  isNaira?: boolean;
  isVNaira?: boolean;
}

const REAL_ASSETS: AssetConfig[] = [
  { key: "naira", label: "USD Balance", symbol: "USD", isNaira: true },
  { key: "vusd", label: "vUSD", symbol: "vUSD", isVNaira: true },
  { key: "sol", label: "Solana", symbol: "SOL", icon: "/media/images/token_icons/solana.png" },
  { key: "wsol", label: "Wrapped Solana", symbol: "WSOL", icon: "/media/images/token_icons/solana.png" },
  { key: "eth_base", label: "Ethereum (Base)", symbol: "ETH", icon: "/media/images/token_icons/eth.png" },
  { key: "usdc_sol", label: "USDC (Solana)", symbol: "USDC", icon: "/media/images/token_icons/usdc.png" },
  { key: "usdc_base", label: "USDC (Base)", symbol: "USDC", icon: "/media/images/token_icons/usdc.png" },
  { key: "usdt_sol", label: "USDT (Solana)", symbol: "USDT", icon: "/media/images/token_icons/usdt.png" },
  { key: "usdg_sol", label: "USDG (Solana)", symbol: "USDG", icon: "/media/images/token_icons/usdg.png" },
];

const DEMO_ASSETS: AssetConfig[] = [
  { key: "demo_naira", label: "Demo USD", symbol: "USD", isNaira: true },
  { key: "demo_sol", label: "Demo Solana", symbol: "SOL", icon: "/media/images/token_icons/solana.png" },
  { key: "demo_usdc_sol", label: "Demo USDC", symbol: "USDC", icon: "/media/images/token_icons/usdc.png" },
];

export function BalanceModal({
  isOpen,
  onClose,
  balance,
  isDemoMode,
  onToggle,
  onSync,
  onFundDemo,
  onOpenSell,
  onOpenPrivateDeposit,
  isSyncing,
}: BalanceModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync balance when modal opens
  useEffect(() => {
    if (isOpen) {
      onSync();
    }
  }, [isOpen, onSync]);

  const formatNaira = (value: number | undefined) => {
    if (value === undefined) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatCrypto = (value: number | undefined) => {
    if (value === undefined) return "0.00";
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const assetsToShow = isDemoMode ? DEMO_ASSETS : REAL_ASSETS;
  const totalBalance = isDemoMode ? balance?.total_demo_usd : balance?.total_usd;
  const canFundDemo = isDemoMode && (balance?.total_demo_usd ?? 0) < 1.0;

  const handleRequestDemoFunds = async () => {
    setIsFunding(true);
    try {
      const res = await onFundDemo(20000);
      toast.success(res.message || "Account funded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to request funds");
    } finally {
      setIsFunding(false);
    }
  };

  const renderAsset = (asset: AssetConfig) => {
    const value = balance?.[asset.key] as number | undefined;
    const isNairaType = asset.isNaira || asset.isVNaira;
    
    return (
      <div
        key={asset.key}
        className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
            {asset.icon ? (
              <img src={asset.icon} alt={asset.label} className="w-6 h-6 object-contain" />
            ) : (
              <span className={cn(
                "font-bold text-lg",
                asset.isNaira ? "text-green-500" : asset.isVNaira ? "text-red-500" : "text-white"
              )}>
                $
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-white uppercase">{asset.label}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Asset</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-base font-bold tabular-nums",
            asset.isNaira ? "text-green-500" : asset.isVNaira ? "text-red-500" : "text-white"
          )}>
            {isNairaType ? formatNaira(value) : formatCrypto(value)}
          </p>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {asset.symbol}
          </p>
        </div>
      </div>
    );
  };

  const modalContent = (
    <div className="flex flex-col gap-8 py-4 overflow-y-auto">
      {/* Balance Overview */}
      <div className="flex flex-col items-center gap-2 px-4 text-center shrink-0">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
          {isSyncing && <Loader className="w-2.5 h-2.5 text-red-600" />}
          Portfolio
        </div>
        <h2 className={cn(
          "text-4xl font-black text-white tracking-tight transition-opacity",
          isSyncing ? "opacity-50" : "opacity-100"
        )}>
          {formatNaira(totalBalance)}
        </h2>
      </div>

      {/* Action Buttons */}
      <div className="px-4 flex flex-row gap-2 shrink-0">
        {isDemoMode && (
          <Button 
            className="flex-1 bg-blue-600 text-white hover:bg-blue-500 font-black h-10 rounded-xl gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10px] tracking-widest"
            onClick={handleRequestDemoFunds}
            disabled={!canFundDemo || isFunding}
          >
            {isFunding ? (
              <Loader className="text-white" />
            ) : (
              <>
                <Fuel size={14} fill="currentColor" />
                Refill
              </>
            )}
          </Button>
        )}
        
        <Button 
          className="flex-1 bg-red-600 text-white hover:bg-red-500 font-black h-10 rounded-xl gap-2 uppercase text-[10px] tracking-widest"
          onClick={onOpenSell}
        >
          <Landmark size={14} />
          Sell
        </Button>

        <Button className="flex-1 bg-white text-black hover:bg-gray-200 font-black h-10 rounded-xl uppercase text-[10px] tracking-widest shadow-none">
          Withdraw
        </Button>
        <Button
          className="flex-1 bg-white/5 text-white hover:bg-white/10 font-black h-10 rounded-xl gap-1.5 uppercase text-[10px] tracking-widest shadow-none border border-white/10"
          onClick={() => { onClose(); onOpenPrivateDeposit(); }}
          title="Deposit privately — source wallet is not linked to your Vantic identity on-chain"
        >
          <ShieldCheck size={13} />
          Private
        </Button>
      </div>

      {isDemoMode && !canFundDemo && (
        <div className="px-4 -mt-4 shrink-0">
          <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
            Refill available when balance &lt; $1.00
          </p>
        </div>
      )}

      {/* Assets List */}
      <div className="space-y-4 shrink-0">
        <div className="px-4">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Your Assets
          </h3>
        </div>
        
        <ScrollArea className="h-[300px] px-4">
          <div className="space-y-3 pb-4">
            {assetsToShow.map(renderAsset)}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  const title = isDemoMode ? "Demo Account" : "Real Account";
  const description = "Overview of your digital assets and balances.";

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="bg-black border-white/10 max-h-[95vh]">
          <DrawerHeader className="text-left relative px-6 shrink-0">
            <div className="flex items-start justify-between">
              <div className="text-left">
                <DrawerTitle className="text-xl font-black tracking-tight text-left text-white uppercase">{title}</DrawerTitle>
                <DrawerDescription className="text-gray-500 text-left text-xs font-medium">{description}</DrawerDescription>
              </div>
              <DemoRealToggle isDemoMode={isDemoMode} onToggle={onToggle} className="mt-1" />
            </div>
          </DrawerHeader>
          {modalContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black border-white/10 p-0 overflow-hidden rounded-3xl shadow-2xl outline-none">
        <DialogHeader className="px-6 pt-6 text-left relative shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase">{title}</DialogTitle>
              <DialogDescription className="text-gray-500 text-sm font-medium">{description}</DialogDescription>
            </div>
            <DemoRealToggle isDemoMode={isDemoMode} onToggle={onToggle} className="mt-1 mr-8" />
          </div>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
