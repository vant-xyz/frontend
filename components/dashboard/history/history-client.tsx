"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Transaction, Position, getUserPositions, getMarket, Market } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Fuel, Landmark, ChevronRight, ChevronLeft, ExternalLink,
  Clock, ArrowUpRight, ReceiptText, Share2, TrendingUp, List, Calendar,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format, getDaysInMonth, getDay } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { SharePositionModal } from "@/components/ui/sharePositionModal";
import Link from "next/link";

interface HistoryClientProps {
  initialTransactions: Transaction[] | null | undefined;
}

const fmtPnl = (pnl: number) => {
  const abs = Math.abs(pnl);
  const sign = pnl >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
};

export function HistoryClient({ initialTransactions }: HistoryClientProps) {
  const transactions = Array.isArray(initialTransactions) ? initialTransactions : [];
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [tab, setTab] = useState<"transactions" | "trades">("transactions");
  const [tradeView, setTradeView] = useState<"list" | "calendar">("list");
  const [positions, setPositions] = useState<Position[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<string>(() => format(new Date(), "yyyy-MM"));
  const [posDetail, setPosDetail] = useState<{ pos: Position; market: Market | null } | null>(null);
  const [shareTarget, setShareTarget] = useState<{ pos: Position; market: Market | null } | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    const load = () =>
      getUserPositions(token)
        .then((r) => setPositions(r.positions || []))
        .catch(() => {});
    load();
    const i = setInterval(load, 1000);
    return () => clearInterval(i);
  }, []);

  const fetchMarketFor = useCallback(async (marketId: string): Promise<Market | null> => {
    try {
      return (await getMarket(marketId)).market;
    } catch {
      return null;
    }
  }, []);

  const monthOptions = useMemo(() => {
    const start = new Date("2026-05-01");
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    const out: string[] = [];
    const d = new Date(start);
    while (d <= end) {
      out.push(format(d, "yyyy-MM"));
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }, []);

  const dayPnlMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of positions) {
      if (p.status !== "SETTLED") continue;
      const cost = p.total_cost > 0 ? p.total_cost : p.shares * (p.avg_entry_price || 0);
      const pnl = Number(p.payout_amount || 0) - cost;
      const dateStr = p.settled_at || p.created_at;
      const key = format(new Date(dateStr), "yyyy-MM-dd");
      m.set(key, (m.get(key) || 0) + pnl);
    }
    return m;
  }, [positions]);

  const calendarData = useMemo(() => {
    const [y, mo] = calendarMonth.split("-").map(Number);
    const firstDay = new Date(y, mo - 1, 1);
    const daysInMonth = getDaysInMonth(firstDay);
    const firstWeekday = (getDay(firstDay) + 6) % 7; // 0=Mon … 6=Sun
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let monthTotal = 0;
    let bestStreak = 0;
    let streak = 0;

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dt = new Date(y, mo - 1, day);
      const key = format(dt, "yyyy-MM-dd");
      const pnl = dayPnlMap.get(key) ?? 0;
      const future = dt > todayEnd;
      if (!future) {
        monthTotal += pnl;
        streak = pnl > 0 ? streak + 1 : 0;
        if (streak > bestStreak) bestStreak = streak;
      }
      return { day, key, pnl, future };
    });

    return { days, firstWeekday, monthTotal, currentStreak: streak, bestStreak };
  }, [calendarMonth, dayPnlMap]);

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "faucet":   return <Fuel size={18} className="text-blue-500" />;
      case "sell":     return <Landmark size={18} className="text-red-500" />;
      case "withdraw": return <ArrowUpRight size={18} className="text-orange-500" />;
      default:         return <ReceiptText size={18} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 uppercase text-[8px] font-black">Success</Badge>;
      case "pending":   return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 uppercase text-[8px] font-black">Pending</Badge>;
      default:          return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 uppercase text-[8px] font-black">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const isUSD = currency.toLowerCase().includes("usd") || currency.toLowerCase().includes("naira") || currency.toUpperCase() === "NGN";
    if (isUSD) return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
    return `${amount} ${currency}`;
  };

  const positionOutcome = (pos: Position) => {
    if (pos.status === "ACTIVE") return { label: "Active", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" };
    if (pos.status === "SETTLED") {
      if (Number(pos.payout_amount) > 0) return { label: "Won", cls: "bg-green-500/10 text-green-400 border-green-500/20" };
      return { label: "Lost", cls: "bg-red-500/10 text-red-400 border-red-500/20" };
    }
    return { label: pos.status, cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
  };

  const txDetails = selectedTx && (
    <div className="space-y-8 py-6 px-1">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-2">
          {selectedTx.type.toLowerCase() === "faucet"
            ? <Fuel size={32} className="text-blue-500" />
            : <Landmark size={32} className="text-red-500" />}
        </div>
        <h3 className="text-2xl font-black text-white tracking-tighter">{selectedTx.type.toUpperCase()}</h3>
        <p className="text-sm text-gray-500 font-medium">{format(new Date(selectedTx.created_at), "PPP p")}</p>
      </div>
      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">Amount</span>
            <span className="text-sm font-black text-white text-right break-all">{formatAmount(selectedTx.amount, selectedTx.currency)}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">Status</span>
            {getStatusBadge(selectedTx.status)}
          </div>
        </div>
        {selectedTx.tx_hash && (
          <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/10 space-y-3">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">Blockchain Hash</span>
            <div className="flex items-center gap-3 min-w-0">
              <code className="flex-1 text-[10px] text-blue-400 font-mono break-all min-w-0">{selectedTx.tx_hash}</code>
              <a
                href={`https://solscan.io/tx/${selectedTx.tx_hash}${(selectedTx as any).nature === "demo" ? "?cluster=devnet" : ""}`}
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
    </div>
  );

  const posDetailContent = posDetail && (() => {
    const { pos, market } = posDetail;
    const outcome = positionOutcome(pos);
    const stake = pos.total_cost > 0 ? pos.total_cost : pos.shares * (pos.avg_entry_price || 0);
    const entryShares = (pos.avg_entry_price || 0) > 0 ? stake / (pos.avg_entry_price || 1) : pos.shares;
    const multiplier = stake > 0 ? Number(pos.payout_amount) / stake : null;
    const avgPriceCents = (pos.avg_entry_price || 0) * 100;
    const payoutAmount = Number(pos.payout_amount || 0);
    const paidOutPct = stake > 0 ? ((payoutAmount - stake) / stake) * 100 : 0;

    return (
      <div className="space-y-5 py-6 px-1">
        {market && (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Market</p>
            <p className="text-sm font-semibold text-white leading-snug">{market.title}</p>
            <Link
              href={`/app/general/${pos.market_id}`}
              className="mt-2 inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-semibold uppercase tracking-widest transition-colors"
            >
              View Market <ExternalLink size={10} />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Your Pick</p>
            <p className={cn("text-base font-black", pos.side === "YES" ? "text-green-400" : "text-red-400")}>{pos.side}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Outcome</p>
            <Badge className={cn("text-[10px] font-black uppercase", outcome.cls)}>{outcome.label}</Badge>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Resolved Side</p>
            <p className="text-base font-black text-white">{market?.outcome ?? "—"}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Shares</p>
            <p className="text-base font-black text-white font-mono">{entryShares.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Entry Price</p>
            <p className="text-base font-black text-white font-mono">{avgPriceCents.toFixed(1)}¢</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Stake</p>
            <p className="text-base font-black text-white font-mono">${stake.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 col-span-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Amount Paid Out</p>
            <p className={cn("text-xl font-black font-mono", payoutAmount > 0 ? "text-green-400" : "text-red-400")}>
              ${payoutAmount.toFixed(2)}
              <span className="text-sm ml-2 opacity-70">({paidOutPct >= 0 ? "+" : ""}{paidOutPct.toFixed(1)}% vs stake)</span>
            </p>
          </div>
          {multiplier !== null && pos.status === "SETTLED" && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Multiplier</p>
              <p className="text-base font-black text-white font-mono">{multiplier.toFixed(2)}x</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setPosDetail(null);
              setShareTarget({ pos, market });
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/8 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
          >
            <Share2 size={14} />
            Share
          </button>
          {market && (
            <Link
              href={`/app/general/${pos.market_id}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              View Market
            </Link>
          )}
        </div>
        <p className="text-[10px] text-gray-600 text-center">{format(new Date(pos.created_at), "PPP p")}</p>
      </div>
    );
  })();

  const { days, firstWeekday, monthTotal, currentStreak, bestStreak } = calendarData;
  const calendarMonthLabel = format(
    new Date(Number(calendarMonth.slice(0, 4)), Number(calendarMonth.slice(5, 7)) - 1, 1),
    "MMM yyyy"
  );
  const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "transactions" | "trades")}>
        <TabsList>
          <TabsTrigger value="transactions"><ReceiptText size={13} />Transactions</TabsTrigger>
          <TabsTrigger value="trades"><TrendingUp size={13} />Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          {transactions.length === 0 ? (
            <div className="text-center py-24 bg-white/[0.02] border border-white/5 rounded-3xl">
              <Clock className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-20" />
              <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">No transactions yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {transactions.map((tx) => (
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
          )}
        </TabsContent>

        <TabsContent value="trades" className="mt-4">
        <div className="space-y-3">
          <Tabs value={tradeView} onValueChange={(v) => setTradeView(v as "list" | "calendar")}>
            <TabsList>
              <TabsTrigger value="list"><List size={13} />List</TabsTrigger>
              <TabsTrigger value="calendar"><Calendar size={13} />Calendar</TabsTrigger>
            </TabsList>
          </Tabs>

          {tradeView === "list" ? (
            positions.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-3xl">
                <Clock className="w-10 h-10 text-gray-700 mx-auto mb-3 opacity-20" />
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">No trades yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {positions.map((pos) => {
                  const outcome = positionOutcome(pos);
                  const payoutAmount = Number(pos.payout_amount || 0);
                  const isLost = pos.status === "SETTLED" && payoutAmount <= 0;
                  const pnl = Number(pos.realized_pnl);
                  const amountColor = isLost ? "text-red-400" : pnl >= 0 ? "text-green-400" : "text-red-400";
                  return (
                    <button
                      key={pos.id}
                      onClick={async () => {
                        const market = await fetchMarketFor(pos.market_id);
                        setPosDetail({ pos, market });
                      }}
                      className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all text-left w-full"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black",
                          pos.side === "YES" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                        )}>
                          {pos.side === "YES" ? "Y" : "N"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white leading-none mb-1">
                            {pos.side} · {pos.shares.toFixed(2)} shares
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{format(new Date(pos.created_at), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className={cn("text-sm font-black tabular-nums", amountColor)}>
                            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                          </p>
                          <Badge className={cn("mt-0.5 uppercase text-[8px] font-black", outcome.cls)}>{outcome.label}</Badge>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const market = await fetchMarketFor(pos.market_id);
                            setShareTarget({ pos, market });
                          }}
                          className="p-2 rounded-lg hover:bg-white/8 text-gray-600 hover:text-white transition-colors"
                        >
                          <Share2 size={14} />
                        </button>
                        <ChevronRight size={16} className="text-gray-700 group-hover:text-white transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 space-y-3">
              {/* Calendar header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    const idx = monthOptions.indexOf(calendarMonth);
                    if (idx > 0) setCalendarMonth(monthOptions[idx - 1]);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">PnL Calendar</p>
                  <p className="text-sm font-bold text-white mt-0.5">{calendarMonthLabel}</p>
                  <p className={cn("text-2xl font-black mt-0.5", monthTotal >= 0 ? "text-green-400" : "text-red-400")}>
                    {fmtPnl(monthTotal)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const idx = monthOptions.indexOf(calendarMonth);
                    if (idx < monthOptions.length - 1) setCalendarMonth(monthOptions[idx + 1]);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 gap-1">
                {DOW_LABELS.map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-gray-600 py-1">{d}</div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstWeekday }, (_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {days.map(({ day, key, pnl, future }) => {
                  const intensity = pnl === 0 ? 0 : Math.min(0.9, Math.max(0.18, Math.abs(pnl) / 500));
                  const bg = future
                    ? "rgba(107,114,128,0.08)"
                    : pnl === 0
                    ? "rgba(255,255,255,0.03)"
                    : pnl > 0
                    ? `rgba(34,197,94,${intensity})`
                    : `rgba(239,68,68,${intensity})`;
                  return (
                    <div
                      key={key}
                      className="rounded-lg border border-white/8 p-1.5 aspect-square flex flex-col justify-between"
                      style={{ background: bg, opacity: future ? 0.35 : 1 }}
                    >
                      <p className="text-[9px] text-white/50 font-bold leading-none">{day}</p>
                      {!future && pnl !== 0 && (
                        <p className={cn("text-[8px] font-black leading-none", pnl > 0 ? "text-green-300" : "text-red-300")}>
                          {fmtPnl(pnl)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer streaks */}
              <div className="flex justify-between pt-2 border-t border-white/5">
                <p className="text-[10px] text-gray-500">
                  Current streak <span className="text-white font-bold">{currentStreak}d</span>
                </p>
                <p className="text-[10px] text-gray-500">
                  Best in {calendarMonthLabel.split(" ")[0]} <span className="text-white font-bold">{bestStreak}d</span>
                </p>
              </div>
            </div>
          )}
        </div>
        </TabsContent>
      </Tabs>

      {/* Transaction detail */}
      {isMobile ? (
        <Drawer open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
          <DrawerContent className="bg-black border-white/10 px-4 pb-8 outline-none">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Transaction Details</DrawerTitle>
            </DrawerHeader>
            {txDetails}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
          <DialogContent className="max-w-md bg-black border-white/10 p-8 rounded-3xl shadow-2xl outline-none border">
            <DialogHeader className="p-0 mb-4">
              <DialogTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Transaction Details</DialogTitle>
            </DialogHeader>
            {txDetails}
          </DialogContent>
        </Dialog>
      )}

      {/* Position detail */}
      {isMobile ? (
        <Drawer open={!!posDetail} onOpenChange={(open) => !open && setPosDetail(null)}>
          <DrawerContent className="bg-black border-white/10 px-4 pb-8 outline-none max-h-[92vh] flex flex-col">
            <DrawerHeader className="px-0 shrink-0">
              <DrawerTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Trade Details</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto flex-1">
              {posDetailContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!posDetail} onOpenChange={(open) => !open && setPosDetail(null)}>
          <DialogContent className="max-w-md bg-black border-white/10 p-8 rounded-3xl shadow-2xl outline-none border max-h-[90vh] flex flex-col">
            <DialogHeader className="p-0 mb-4 shrink-0">
              <DialogTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Trade Details</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1">
              {posDetailContent}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Share modal */}
      {shareTarget && (
        <SharePositionModal
          isOpen
          onClose={() => setShareTarget(null)}
          position={shareTarget.pos}
          market={shareTarget.market ?? ({ id: shareTarget.pos.market_id, title: "Vantic Market", market_type: "GEM" } as Market)}
          pnl={Number(shareTarget.pos.realized_pnl)}
          pnlPct={shareTarget.pos.total_cost > 0
            ? (Number(shareTarget.pos.realized_pnl) / shareTarget.pos.total_cost) * 100
            : 0}
          avgPriceCents={(shareTarget.pos.avg_entry_price || 0) * 100}
          currentPriceCents={shareTarget.pos.status === "SETTLED" ? 100 : (shareTarget.pos.avg_entry_price || 0) * 100}
        />
      )}
    </div>
  );
}
