"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { BarChart3, ExternalLink, CircleHelp, X } from "lucide-react";
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
  /** When set, renders a text button with this label instead of the icon button */
  label?: string;
}

export function PositionsWidget({ className, label }: PositionsWidgetProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<PriceMap>({});
  const [showPnlHelp, setShowPnlHelp] = useState(false);
  const pollPositionsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollPricesRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const fetchPositions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getUserPositions(token);
      setPositions(res.positions.filter((p) => p.status === "ACTIVE"));
    } catch {
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchPrices = useCallback(async (positionList: Position[]) => {
    if (positionList.length === 0) return;
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

  // Always poll positions every 3s (for badge count + button tint)
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPositions();
    pollPositionsRef.current = setInterval(fetchPositions, 3000);
    return () => {
      if (pollPositionsRef.current) clearInterval(pollPositionsRef.current);
    };
  }, [fetchPositions, token]);

  // Poll prices every 3s only when modal is open
  useEffect(() => {
    if (!open || !positions || positions.length === 0) {
      if (pollPricesRef.current) clearInterval(pollPricesRef.current);
      return;
    }
    fetchPrices(positions);
    pollPricesRef.current = setInterval(() => fetchPrices(positions), 3000);
    return () => {
      if (pollPricesRef.current) clearInterval(pollPricesRef.current);
    };
  }, [open, positions, fetchPrices]);

  // fetch prices once on open
  useEffect(() => {
    if (open && positions && positions.length > 0) fetchPrices(positions);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = positions?.length ?? 0;

  const globalPnl = positions && positions.length > 0 && Object.keys(prices).length > 0
    ? positions.reduce<number | null>((acc, pos) => {
        const p = calcPnl(pos, prices);
        if (p === null) return acc;
        return (acc ?? 0) + p;
      }, null)
    : null;

  const pnlTint = globalPnl === null ? "neutral" : globalPnl >= 0 ? "profit" : "loss";

  const inner = (
    <div className="flex flex-col">
      {/* Global PnL header */}
      {!loading && positions && positions.length > 0 && (
        <div className={cn(
          "mx-4 mb-3 p-3 rounded-xl border",
          pnlTint === "neutral" ? "bg-white/5 border-white/10"
            : pnlTint === "profit" ? "bg-green-500/10 border-green-500/20"
              : "bg-red-500/10 border-red-500/20"
        )}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Unrealised P&amp;L</p>
            <button
              onClick={() => setShowPnlHelp(true)}
              className="text-gray-600 hover:text-gray-400 transition-colors"
            >
              <CircleHelp size={11} />
            </button>
          </div>
          <p className={cn(
            "text-2xl font-black tabular-nums",
            pnlTint === "neutral" ? "text-gray-400"
              : pnlTint === "profit" ? "text-green-400" : "text-red-400"
          )}>
            {globalPnl === null
              ? "—"
              : <ReelAnimation text={formatPnl(globalPnl)} animateOnHover={false} />
            }
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">{activeCount} active position{activeCount !== 1 ? "s" : ""}</p>
        </div>
      )}

      {/* PnL help overlay */}
      {showPnlHelp && (
        <div className="absolute inset-0 z-10 bg-black/95 backdrop-blur-sm flex flex-col p-5">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-base font-black text-white">Unrealised P&amp;L</h3>
            <button
              onClick={() => setShowPnlHelp(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>
          <div className="space-y-3 text-sm text-gray-300">
            <p>
              <span className="text-white font-semibold">Unrealised P&amp;L</span> is the profit or loss on your active positions if you were to close them right now at the current market price.
            </p>
            <p>
              It is calculated as: <span className="text-white font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">shares × (current price − avg entry price)</span>
            </p>
            <p>
              This number updates every 3 seconds based on the live orderbook. It is <span className="text-white font-semibold">not locked in</span> until you close or sell your position — the market can move against you before settlement.
            </p>
            <p className="text-xs text-gray-500">
              Positions settle automatically at market expiry. Your final P&amp;L is determined by the resolved outcome, not the live price.
            </p>
          </div>
          <button
            onClick={() => setShowPnlHelp(false)}
            className="mt-6 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors"
          >
            Got it
          </button>
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

  const triggerButton = label ? (
    // Text-label variant (used on mobile market detail page)
    <button
      onClick={() => setOpen(true)}
      className={cn(
        "text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-md transition-colors",
        pnlTint === "profit"
          ? "text-green-400 bg-green-500/10 hover:bg-green-500/20"
          : pnlTint === "loss"
            ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
            : "text-gray-400 bg-white/5 hover:bg-white/10",
        activeCount > 0 && "font-black",
        className
      )}
    >
      {label}{activeCount > 0 ? ` · ${activeCount}` : ""}
    </button>
  ) : (
    // Icon variant (used in dashboard header)
    <Button
      variant="outline"
      size="icon"
      onClick={() => setOpen(true)}
      className={cn(
        "relative h-10 w-10 rounded-xl border transition-all",
        pnlTint === "profit"
          ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
          : pnlTint === "loss"
            ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white",
        className
      )}
      title="Active positions"
    >
      <BarChart3 size={18} />
      {activeCount > 0 && (
        <span className={cn(
          "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black text-white px-1",
          pnlTint === "profit" ? "bg-green-500" : pnlTint === "loss" ? "bg-red-600" : "bg-red-600"
        )}>
          {activeCount > 99 ? "99+" : activeCount}
        </span>
      )}
    </Button>
  );

  const dialogInner = <div className="relative overflow-hidden">{inner}</div>;

  return (
    <>
      {triggerButton}

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="bg-black border-white/10 text-white pb-6 max-h-[75vh]">
            <DrawerHeader>
              <DrawerTitle>Active Positions</DrawerTitle>
            </DrawerHeader>
            <div className="relative overflow-y-auto">{inner}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-black border-white/10 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle>Active Positions</DialogTitle>
            </DialogHeader>
            <div className="relative max-h-[60vh] overflow-y-auto">{inner}</div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
