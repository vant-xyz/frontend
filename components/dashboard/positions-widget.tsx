"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { BarChart3, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { getUserPositions, getOrderbook, Position } from "@/lib/api";
import { ReelAnimation } from "@/components/landing/reel-animation";
import { useRouter } from "next/navigation";

type PriceMap = Record<string, { yesBid: number; noBid: number }>;

function calcPnl(pos: Position, prices: PriceMap): number | null {
  const p = prices[pos.market_id];
  if (!p) return null;
  const currentPrice = pos.side === "YES" ? p.yesBid : p.noBid;
  const entry = pos.avg_entry_price ?? 0;
  const shares = pos.shares ?? 0;
  return shares * (currentPrice - entry);
}

function toFraction(v?: number): number {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n <= 1 ? n : n / 100;
}

function formatPnl(pnl: number): string {
  const abs = Math.abs(pnl);
  const sign = pnl >= 0 ? "+" : "-";
  return `${sign}$${abs.toFixed(2)}`;
}

function PositionRow({ pos, prices }: { pos: Position; prices: PriceMap }) {
  const router = useRouter();
  const shares = pos.shares ?? 0;
  const avgEntry = pos.avg_entry_price ?? 0;
  const cost = shares * avgEntry;
  const pnl = calcPnl(pos, prices);
  const hasPnl = pnl !== null;
  const isProfit = hasPnl && pnl >= 0;

  return (
    <button
      onClick={() => router.push(`/market/${pos.market_id}`)}
      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn(
          "shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
          pos.side === "YES" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
        )}>
          {pos.side}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-mono truncate">
            {pos.market_id.slice(0, 8)}…
          </p>
          <p className="text-xs text-gray-400">
            {shares.toFixed(2)} sh · {(avgEntry * 100).toFixed(1)}¢ avg
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className={cn(
            "text-sm font-bold tabular-nums",
            hasPnl ? (isProfit ? "text-green-400" : "text-red-400") : "text-white"
          )}>
            {hasPnl
              ? <ReelAnimation text={formatPnl(pnl)} animateOnHover={false} />
              : `$${cost.toFixed(2)}`
            }
          </p>
          {hasPnl && (
            <p className="text-[10px] text-gray-500 font-mono tabular-nums">
              cost ${cost.toFixed(2)}
            </p>
          )}
        </div>
        <ExternalLink size={12} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
      </div>
    </button>
  );
}

interface PositionsWidgetProps {
  className?: string;
  /** When provided, only shows positions for this market and renders inline (no button trigger) */
  inlineMarketId?: string;
  /** Called by parent when a trade is placed so we can refetch */
  onTradePlaced?: (refetch: () => void) => void;
}

export function PositionsWidget({ className, inlineMarketId, onTradePlaced }: PositionsWidgetProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<PriceMap>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInline = !!inlineMarketId;
  const isVisible = isInline || open;

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const fetchPositions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getUserPositions(token, inlineMarketId);
      setPositions(res.positions.filter((p) => p.status === "ACTIVE"));
    } catch {
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [token, inlineMarketId]);

  const fetchPrices = useCallback(async (positionList: Position[]) => {
    const marketIds = [...new Set(positionList.map((p) => p.market_id))];
    const results = await Promise.allSettled(
      marketIds.map((id) => getOrderbook(id).then((res) => ({ id, ob: res.orderbook })))
    );
    const next: PriceMap = {};
    for (const r of results) {
      if (r.status === "fulfilled") {
        const { id, ob } = r.value;
        next[id] = {
          yesBid: toFraction(ob?.yes_bids?.[0]?.price),
          noBid: toFraction(ob?.no_bids?.[0]?.price),
        };
      }
    }
    setPrices((prev) => ({ ...prev, ...next }));
  }, []);

  // initial load
  useEffect(() => {
    if (!isVisible) return;
    if (positions === null) {
      setLoading(true);
      fetchPositions();
    }
  }, [isVisible, positions, fetchPositions]);

  // 3s poll while visible
  useEffect(() => {
    if (!isVisible) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      await fetchPositions();
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isVisible, fetchPositions]);

  // fetch prices whenever positions change
  useEffect(() => {
    if (positions && positions.length > 0) fetchPrices(positions);
  }, [positions, fetchPrices]);

  // expose refetch to parent for post-trade refresh
  useEffect(() => {
    onTradePlaced?.(fetchPositions);
  }, [onTradePlaced, fetchPositions]);

  const activeCount = positions?.length ?? 0;

  const globalPnl = positions && positions.length > 0 && Object.keys(prices).length > 0
    ? positions.reduce<number | null>((acc, pos) => {
        const p = calcPnl(pos, prices);
        if (p === null) return acc;
        return (acc ?? 0) + p;
      }, null)
    : null;

  const inner = (
    <div className="flex flex-col">
      {/* Global PnL header */}
      {!loading && positions && positions.length > 0 && (
        <div className={cn(
          "mx-4 mb-3 p-3 rounded-xl border",
          globalPnl === null
            ? "bg-white/5 border-white/10"
            : globalPnl >= 0
              ? "bg-green-500/10 border-green-500/20"
              : "bg-red-500/10 border-red-500/20"
        )}>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Unrealised P&L</p>
          <p className={cn(
            "text-2xl font-black tabular-nums",
            globalPnl === null ? "text-gray-400"
              : globalPnl >= 0 ? "text-green-400" : "text-red-400"
          )}>
            {globalPnl === null
              ? "—"
              : <ReelAnimation text={formatPnl(globalPnl)} animateOnHover={false} />
            }
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">{activeCount} active position{activeCount !== 1 ? "s" : ""} · updates every 3s</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader className="w-5 h-5 text-red-600" />
        </div>
      ) : !positions || positions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
          <p className="text-sm text-gray-500 mb-2">No active positions</p>
          <button
            onClick={() => { setOpen(false); router.push("/app"); }}
            className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors underline underline-offset-2"
          >
            Browse markets to get started
          </button>
        </div>
      ) : (
        <div className="space-y-1 px-2 pb-2">
          {positions.map((pos) => (
            <PositionRow key={pos.id} pos={pos} prices={prices} />
          ))}
        </div>
      )}
    </div>
  );

  // Inline mode: no button, just the list (used on MarketDetailView)
  if (isInline) {
    return <div className="w-full">{inner}</div>;
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className={cn(
          "relative h-10 w-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all",
          className
        )}
        title="Active positions"
      >
        <BarChart3 size={18} />
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white px-1">
            {activeCount > 99 ? "99+" : activeCount}
          </span>
        )}
      </Button>

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="bg-black border-white/10 text-white pb-6 max-h-[75vh]">
            <DrawerHeader>
              <DrawerTitle>Active Positions</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto">{inner}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-black border-white/10 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle>Active Positions</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">{inner}</div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
