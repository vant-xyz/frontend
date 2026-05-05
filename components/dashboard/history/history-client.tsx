"use client";

import { useEffect, useMemo, useState } from "react";
import { Transaction, Position, getUserPositions } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, Landmark, ChevronRight, ExternalLink, Clock, ArrowUpRight, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface HistoryClientProps {
  initialTransactions: Transaction[];
}

export function HistoryClient({ initialTransactions }: HistoryClientProps) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [tab, setTab] = useState<"transactions" | "trades">("transactions");
  const [tradeView, setTradeView] = useState<"list" | "calendar">("list");
  const [positions, setPositions] = useState<Position[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    const load = () => {
      getUserPositions(token)
        .then((res) => setPositions(res.positions || []))
        .catch(() => setPositions([]));
    };
    load();
    const i = setInterval(load, 1000);
    return () => clearInterval(i);
  }, []);

  const monthlyPnl = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of positions) {
      const key = format(new Date(p.created_at), "yyyy-MM");
      const current = map.get(key) || 0;
      map.set(key, current + Number(p.realized_pnl || 0));
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [positions]);

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
    const isUSD = currency.toLowerCase().includes("usd") || currency.toLowerCase().includes("naira") || currency.toUpperCase() === "NGN";
    if (isUSD) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
    }
    return `${amount} ${currency}`;
  };

  const txDetails = selectedTx && (
    <div className="space-y-8 py-6 px-1">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-2">
          {selectedTx.type.toLowerCase() === "faucet" ? <Fuel size={32} className="text-blue-500" /> : <Landmark size={32} className="text-red-500" />}
        </div>
        <h3 className="text-2xl font-black text-white tracking-tighter">{selectedTx.type.toUpperCase()}</h3>
        <p className="text-sm text-gray-500 font-medium">{format(new Date(selectedTx.created_at), "PPP p")}</p>
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
        </div>

        {selectedTx.tx_hash && (
          <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/10 space-y-3">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">Blockchain Hash</span>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-[10px] text-blue-400 font-mono break-all truncate">{selectedTx.tx_hash}</code>
              <a href={`https://solscan.io/tx/${selectedTx.tx_hash}${selectedTx.nature === "demo" ? "?cluster=devnet" : ""}`} target="_blank" rel="noopener noreferrer">
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400">
                  <ExternalLink size={14} />
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={tab === "transactions" ? "default" : "outline"} onClick={() => setTab("transactions")}>Transactions</Button>
        <Button variant={tab === "trades" ? "default" : "outline"} onClick={() => setTab("trades")}>Trades</Button>
      </div>

      {tab === "transactions" ? (
        initialTransactions.length === 0 ? (
          <div className="text-center py-24 bg-white/[0.02] border border-white/5 rounded-3xl">
            <Clock className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-20" />
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">No transactions yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {initialTransactions.map((tx) => (
              <button
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">{getIcon(tx.type)}</div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tight leading-none mb-1">{tx.type} {tx.currency}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{format(new Date(tx.created_at), "MMM d, HH:mm")}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className={cn("text-sm font-black tabular-nums", tx.type.toLowerCase() === "faucet" ? "text-green-500" : "text-white")}>
                      {tx.type.toLowerCase() === "faucet" ? "+" : "-"}{formatAmount(tx.amount, tx.currency)}
                    </p>
                    <div className="flex justify-end mt-0.5">{getStatusBadge(tx.status)}</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-700 group-hover:text-white transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant={tradeView === "list" ? "default" : "outline"} onClick={() => setTradeView("list")}>List</Button>
            <Button size="sm" variant={tradeView === "calendar" ? "default" : "outline"} onClick={() => setTradeView("calendar")}>Calendar</Button>
          </div>

          {tradeView === "list" ? (
            <div className="grid grid-cols-1 gap-2">
              {positions.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">{p.side} • {p.shares.toFixed(2)} shares</p>
                      <p className="text-[10px] text-gray-500 mt-1">{format(new Date(p.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-black", Number(p.realized_pnl) >= 0 ? "text-green-400" : "text-red-400")}>${Number(p.realized_pnl).toFixed(2)}</p>
                      <Badge className={cn("mt-1 uppercase text-[8px] font-black", p.status === "ACTIVE" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : p.status === "SETTLED" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20")}>{p.status}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const url = `${window.location.origin}/market/${p.market_id}`;
                        const txt = `${p.side} ${p.shares.toFixed(2)} shares • ${p.status} • PnL $${Number(p.realized_pnl).toFixed(2)}`;
                        if (navigator.share) {
                          try { await navigator.share({ title: "Vantic Trade", text: txt, url }); return; } catch {}
                        }
                        await navigator.clipboard.writeText(`${txt}\n${url}`);
                      }}
                    >
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {monthlyPnl.map(([month, pnl]) => {
                const isPos = pnl >= 0;
                const intensity = Math.min(0.9, Math.max(0.2, Math.abs(pnl) / 500));
                return (
                  <div
                    key={month}
                    className="rounded-xl border border-white/10 p-3"
                    style={{ background: isPos ? `rgba(34,197,94,${intensity})` : `rgba(239,68,68,${intensity})` }}
                  >
                    <p className="text-[10px] text-white/90 font-bold">{month}</p>
                    <p className="text-xs text-white font-black mt-2">${pnl.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isMobile ? (
        <Drawer open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
          <DrawerContent className="bg-black border-white/10 px-4 pb-8 outline-none">
            <DrawerHeader className="px-0"><DrawerTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Transaction Details</DrawerTitle></DrawerHeader>
            {txDetails}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
          <DialogContent className="max-w-md bg-black border-white/10 p-8 rounded-3xl shadow-2xl outline-none border">
            <DialogHeader className="p-0 mb-4"><DialogTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Transaction Details</DialogTitle></DialogHeader>
            {txDetails}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
