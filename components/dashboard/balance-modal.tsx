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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalBalance: number | null;
  isDemoMode: boolean;
  onToggle: () => void;
}

const cryptoAssets = [
  { asset: "SOL", name: "Solana", icon: "◎" },
  { asset: "USDC", name: "USD Coin", icon: "$" },
  { asset: "USDT", name: "Tether", icon: "₮" },
  { asset: "BTC", name: "Bitcoin", icon: "₿" },
  { asset: "ETH", name: "Ethereum", icon: "Ξ" },
];

export function BalanceModal({
  isOpen,
  onClose,
  totalBalance,
  isDemoMode,
  onToggle,
}: BalanceModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "₦0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(value);
  };

  const getWalletAddress = (asset: string): string => {
    const baseAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    return `${baseAddress.slice(0, 2)}${asset}${baseAddress.slice(4)}`;
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const modalContent = (
    <div className="flex flex-col gap-6 p-4">
      {/* Balance Section */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-1">
            {isDemoMode ? "Demo" : "Real"} Balance
          </p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(totalBalance)}
          </p>
        </div>

        {/* Demo/Real Toggle */}
        <div className="flex items-center gap-3">
          <span className={cn("text-sm font-medium", !isDemoMode ? "text-white" : "text-gray-400")}>
            Real
          </span>
          <Switch
            checked={isDemoMode}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-red-600"
          />
          <span className={cn("text-sm font-medium", isDemoMode ? "text-white" : "text-gray-400")}>
            Demo
          </span>
        </div>
      </div>

      {/* Crypto Assets List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Funding Addresses
        </h3>
        <div className="flex flex-col gap-2">
          {cryptoAssets.map((crypto) => {
            const walletAddress = getWalletAddress(crypto.asset);

            return (
              <div
                key={crypto.asset}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-900 border border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg">
                    {crypto.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{crypto.name}</p>
                    <p className="text-xs text-gray-400">{crypto.asset}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    0 {crypto.asset}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {formatAddress(walletAddress)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Your Balance</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">{modalContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
