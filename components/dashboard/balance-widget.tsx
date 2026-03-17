"use client";

import { cn } from "@/lib/utils";

interface BalanceWidgetProps {
  totalBalance: number | null;
  onClick?: () => void;
  className?: string;
  variant?: "desktop" | "mobile";
}

export function BalanceWidget({
  totalBalance,
  onClick,
  className,
  variant = "desktop",
}: BalanceWidgetProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "₦0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(value);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-end gap-1 rounded-lg bg-gray-900/50 border border-gray-800 hover:bg-gray-800/50 transition-all cursor-pointer",
        variant === "desktop" ? "p-3" : "p-2",
        className
      )}
    >
      <span className="text-xs text-gray-400 font-medium">Balance</span>
      <span className={cn(
        "font-bold text-white tabular-nums",
        variant === "desktop" ? "text-lg" : "text-sm"
      )}>
        {formatCurrency(totalBalance)}
      </span>
    </button>
  );
}
