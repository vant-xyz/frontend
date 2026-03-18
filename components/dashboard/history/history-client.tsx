"use client";

import { useState } from "react";
import { Transaction } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Fuel, 
  Landmark, 
  ChevronRight, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ReceiptText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
import { useIsMobile } from "@/hooks/use-mobile";

interface HistoryClientProps {
  initialTransactions: Transaction[];
}

export function HistoryClient({ initialTransactions }: HistoryClientProps) {
  const [selectedTx, setSelectedAsset] = useState<Transaction | null>(null);
  const isMobile = useIsMobile();

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "faucet":
        return <Fuel size={18} className="text-blue-500" />;
      case "sell":
        return <Landmark size={18} className="text-red-500" />;
      case "withdraw":
        return <ArrowUpRight size={18} className="text-orange-500" />;
      default:
        return <ReceiptText size={18} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 uppercase text-[8px] font-black">Success</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 uppercase text-[8px] font-black">Pending</Badge>;
      default:
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 uppercase text-[8px] font-black">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const isNaira = currency.toLowerCase().includes("naira") || currency.toUpperCase() === "NGN";
    if (isNaira) {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);
    }
    return `${amount} ${currency}`;
  };

  const txDetails = selectedTx && (
    <div className="space-y-8 py-6 px-1">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-2">
          {selectedTx.type.toLowerCase() === "faucet" ? <Fuel size={32} className="text-blue-500" /> : <Landmark size={32} className="text-red-500" />}
        </div>
        <h3 className="text-2xl font-black text-white tracking-tighter">
          {selectedTx.type.toUpperCase()}
        </h3>
        <p className="text-sm text-gray-500 font-medium">
          {format(new Date(selectedTx.created_at), "PPP p")}
        </p>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</span>
            <span className="text-sm font-black text-white">{formatAmount(selectedTx.amount, selectedTx.currency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</span>
            {getStatusBadge(selectedTx.status)}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nature</span>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{selectedTx.nature}</span>
          </div>
        </div>

        {selectedTx.tx_hash && (
          <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/10 space-y-3">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">Blockchain Hash</span>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-[10px] text-blue-400 font-mono break-all truncate">{selectedTx.tx_hash}</code>
              <a 
                href={`https://solscan.io/tx/${selectedTx.tx_hash}${selectedTx.nature === "demo" ? "?cluster=devnet" : ""}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400">
                  <ExternalLink size={14} />
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center text-gray-600 font-bold uppercase tracking-[0.2em]">
        Transaction ID: {selectedTx.id}
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {initialTransactions.length === 0 ? (
        <div className="text-center py-24 bg-white/[0.02] border border-white/5 rounded-3xl">
          <Clock className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-20" />
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">No transactions yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {initialTransactions.map((tx) => (
            <button
              key={tx.id}
              onClick={() => setSelectedAsset(tx)}
              className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  {getIcon(tx.type)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-tight leading-none mb-1">
                    {tx.type} {tx.currency}
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {format(new Date(tx.created_at), "MMM d, HH:mm")}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className={cn(
                    "text-sm font-black tabular-nums",
                    tx.type.toLowerCase() === "faucet" ? "text-green-500" : "text-white"
                  )}>
                    {tx.type.toLowerCase() === "faucet" ? "+" : "-"}{formatAmount(tx.amount, tx.currency)}
                  </p>
                  <div className="flex justify-end mt-0.5">
                    {getStatusBadge(tx.status)}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-700 group-hover:text-white transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Transaction Details Modal/Drawer */}
      {isMobile ? (
        <Drawer open={!!selectedTx} onOpenChange={(open) => !open && setSelectedAsset(null)}>
          <DrawerContent className="bg-black border-white/10 px-4 pb-8 outline-none">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Transaction Details</DrawerTitle>
            </DrawerHeader>
            {txDetails}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedAsset(null)}>
          <DialogContent className="max-w-md bg-black border-white/10 p-8 rounded-3xl shadow-2xl outline-none border">
            <DialogHeader className="p-0 mb-4">
              <DialogTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Transaction Details</DialogTitle>
            </DialogHeader>
            {txDetails}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
