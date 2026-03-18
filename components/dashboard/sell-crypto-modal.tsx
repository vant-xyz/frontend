"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Slider } from "@/components/ui/slider";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { sellCrypto, getAssetVantPrice, type BalanceInfo, type PriceData, type SellCryptoResponse } from "@/lib/api";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ChevronRight, 
  Wallet,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface SellCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: BalanceInfo | null;
  prices: PriceData & { vant_rate: number | null };
  isDemoMode: boolean;
  onSuccess: () => void;
}

type Step = "select" | "amount" | "preview" | "success";

interface AssetOption {
  key: string;
  label: string;
  symbol: string;
  icon: string;
  balance: number;
}

export function SellCryptoModal({
  isOpen,
  onClose,
  balance,
  prices,
  isDemoMode,
  onSuccess,
}: SellCryptoModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [selectedAsset, setSelectedAsset] = useState<AssetOption | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [assetPrice, setAssetPrice] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setStep("select");
      setSelectedAsset(null);
      setAmount(0);
      setAssetPrice(null);
    }
  }, [isOpen]);

  const assets: AssetOption[] = useMemo(() => {
    const list = [
      { key: "sol", label: "Solana", symbol: "SOL", icon: "/media/images/token_icons/solana.png", balance: balance?.sol || 0 },
      { key: "usdc_sol", label: "USDC (Solana)", symbol: "USDC", icon: "/media/images/token_icons/usdc.png", balance: balance?.usdc_sol || 0 },
      { key: "usdc_base", label: "USDC (Base)", symbol: "USDC", icon: "/media/images/token_icons/usdc.png", balance: balance?.usdc_base || 0 },
      { key: "usdt_sol", label: "USDT (Solana)", symbol: "USDT", icon: "/media/images/token_icons/usdt.png", balance: balance?.usdt_sol || 0 },
      { key: "eth_base", label: "Ethereum (Base)", symbol: "ETH", icon: "/media/images/token_icons/eth.png", balance: balance?.eth_base || 0 },
      { key: "demo_sol", label: "Demo Solana", symbol: "SOL", icon: "/media/images/token_icons/solana.png", balance: balance?.demo_sol || 0 },
      { key: "demo_usdc_sol", label: "Demo USDC", symbol: "USDC", icon: "/media/images/token_icons/usdc.png", balance: balance?.demo_usdc_sol || 0 },
    ];
    return list.filter(a => isDemoMode ? a.key.startsWith("demo_") && a.balance > 0 : !a.key.startsWith("demo_") && a.balance > 0);
  }, [balance, isDemoMode]);

  const fetchPrice = async (asset: AssetOption) => {
    setFetchingPrice(true);
    try {
      const cleanKey = asset.key.replace("demo_", "");
      const res = await getAssetVantPrice(cleanKey);
      setAssetPrice(res.price);
      setStep("amount");
    } catch (err) {
      toast.error("Failed to fetch current rate. Using fallback.");
      setStep("amount");
    } finally {
      setFetchingPrice(false);
    }
  };

  const exchangeDetails = useMemo(() => {
    const rate = assetPrice || 0;
    const received = amount * rate;
    return { rate, received };
  }, [amount, assetPrice]);

  const handleSell = async () => {
    if (!selectedAsset) return;
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await sellCrypto(token, {
        asset: selectedAsset.key,
        amount: amount,
        nature: isDemoMode ? "demo" : "real",
      });
      toast.success(res.message);
      onClose(); // Close modal immediately
      router.push("/app/history");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const renderContent = () => {
    switch (step) {
      case "select":
        return (
          <div className="space-y-4 py-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Choose Asset to Sell</p>
            {assets.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/5">
                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">No sellable assets found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {assets.map((asset) => (
                  <button
                    key={asset.key}
                    type="button"
                    disabled={fetchingPrice}
                    onClick={() => {
                      setSelectedAsset(asset);
                      fetchPrice(asset);
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                        <img src={asset.icon} alt={asset.label} className="w-6 h-6 object-contain" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white uppercase">{asset.label}</p>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">Available: {asset.balance} {asset.symbol}</p>
                      </div>
                    </div>
                    {fetchingPrice && selectedAsset?.key === asset.key ? (
                      <Loader className="w-4 h-4 text-red-600" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case "amount":
        return (
          <div className="space-y-8 py-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                onClick={() => setStep("select")} 
                className="h-8 w-8 rounded-full text-gray-500 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft size={18} />
              </Button>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Set Amount to Sell</p>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Input
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xl font-black text-white px-4 focus:ring-red-500/50"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => setAmount(selectedAsset?.balance || 0)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-red-500 shadow-none"
                >
                  Max
                </button>
              </div>

              <div className="px-2">
                <Slider
                  value={[amount]}
                  max={selectedAsset?.balance || 0}
                  step={0.000001}
                  onValueChange={(val) => setAmount(val[0])}
                  className="[&_[role=slider]]:bg-red-600 [&_[role=slider]]:border-red-600"
                />
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Asset</p>
                  <p className="text-sm font-bold text-white">{selectedAsset?.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Remaining</p>
                  <p className="text-xs font-bold text-white">{((selectedAsset?.balance || 0) - amount).toFixed(6)} {selectedAsset?.symbol}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep("preview")}
              type="button"
              disabled={amount <= 0 || amount > (selectedAsset?.balance || 0)}
              className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest gap-2 disabled:opacity-20 text-[10px] shadow-none"
            >
              Preview Sale
              <ChevronRight size={14} />
            </Button>
          </div>
        );

      case "preview":
        return (
          <div className="space-y-8 py-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                onClick={() => setStep("amount")} 
                className="h-8 w-8 rounded-full text-gray-500 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft size={18} />
              </Button>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Review Transaction</p>
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">You Sell</p>
                  <p className="text-sm font-black text-white">{amount} {selectedAsset?.symbol}</p>
                </div>
                <div className="flex justify-center">
                  <ArrowRight size={16} className="text-red-600 rotate-90" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">You Receive</p>
                  <p className="text-xl font-black text-green-500">{formatNaira(exchangeDetails.received)}</p>
                </div>
              </div>

              <div className="px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap">Exchange Rate</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 text-right">
                    1 {selectedAsset?.symbol} = {formatNaira(assetPrice || 0)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSell}
              type="button"
              disabled={loading || exchangeDetails.received <= 0}
              className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest gap-2 disabled:opacity-50 text-[10px] shadow-none"
            >
              {loading ? <Loader className="text-black" /> : "Confirm Sale"}
            </Button>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <CheckCircle2 size={40} className="text-green-500 animate-in fade-in duration-1000 slide-in-from-bottom-2" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Sale Successful</h3>
              <p className="text-sm font-medium">Your balance will update shortly.</p>
            </div>
          </div>
        );
    }
  };

  const title = "Sell Crypto";

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="bg-black border-white/10 px-4 pb-8 max-h-[95vh] outline-none">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle className="text-xl font-black text-white uppercase tracking-tight">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            {renderContent()}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black border-white/10 p-8 rounded-3xl shadow-2xl outline-none border">
        <DialogHeader className="text-left p-0 mb-4">
          <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}