"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface BalanceWidgetProps {
  totalBalance: number | null;
  onClick?: () => void;
  className?: string;
}

function formatBalance(value: number | null): string {
  if (value === null || value === undefined) return "$0.00";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function BalanceWidget({
  totalBalance,
  onClick,
  className,
}: BalanceWidgetProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-10 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black tabular-nums tracking-tight text-lg shadow-lg shadow-black/20 transition-all gap-2",
        className
      )}
    >
      <Wallet size={16} className="text-gray-400 shrink-0" />
      {formatBalance(totalBalance)}
    </Button>
  );
}
