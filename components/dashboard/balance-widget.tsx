"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BalanceWidgetProps {
  totalBalance: number | null;
  onClick?: () => void;
  className?: string;
}

export function BalanceWidget({
  totalBalance,
  onClick,
  className,
}: BalanceWidgetProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-10 px-6 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black tabular-nums tracking-tight text-lg shadow-lg shadow-black/20 transition-all",
        className
      )}
    >
      {formatCurrency(totalBalance)}
    </Button>
  );
}
