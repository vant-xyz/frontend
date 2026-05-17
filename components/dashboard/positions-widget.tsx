"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { BarChart3, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { getUserPositions, Position } from "@/lib/api";
import { useRouter } from "next/navigation";

function PositionRow({ pos }: { pos: Position }) {
  const router = useRouter();
  const shares = pos.shares ?? 0;
  const avgEntry = pos.avg_entry_price ?? 0;
  const cost = (pos.total_cost != null && pos.total_cost > 0)
    ? pos.total_cost
    : shares * avgEntry;

  return (
    <button
      onClick={() => router.push(`/app/markets/${pos.market_id}`)}
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
            {shares.toFixed(2)} shares · {(avgEntry * 100).toFixed(1)}¢ avg
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-white tabular-nums">
          ${cost.toFixed(2)}
        </span>
        <ExternalLink size={12} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
      </div>
    </button>
  );
}

interface PositionsWidgetProps {
  className?: string;
}

export function PositionsWidget({ className }: PositionsWidgetProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const fetchPositions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getUserPositions(token);
      setPositions(res.positions.filter((p) => p.status === "ACTIVE"));
    } catch {
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (open && positions === null) {
      fetchPositions();
    }
  }, [open, positions, fetchPositions]);

  const activeCount = positions?.length ?? 0;

  const inner = (
    <div className="flex flex-col">
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
            <PositionRow key={pos.id} pos={pos} />
          ))}
        </div>
      )}
    </div>
  );

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
