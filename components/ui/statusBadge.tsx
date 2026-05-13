
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'open':
        return 'bg-success/10 text-success border-success/20';
      case 'waiting':
      case 'pending':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'resolved':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'cancelled':
        return 'bg-error/10 text-error border-error/20';
      case 'mutual':
        return 'bg-white/5 text-white/70 border-white/10';
      case 'consensus':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-white/5 text-white/50 border-white/10';
    }
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
      getStatusStyles(),
      className
    )}>
      {status}
    </span>
  );
}

const CHAIN_STATE_LABELS: Record<string, string> = {
  PENDING_CHAIN_CONFIRM: "Confirming",
  CHAIN_RESOLVED: "Settled",
  CHAIN_CANCELLED: "Cancelled",
  CHAIN_PENDING: "Pending",
  CHAIN_FAILED: "Failed",
  CHAIN_RESOLVE_FAILED: "Settlement failed",
};

export function ChainIndicator({ state }: { state: string }) {
  const label = CHAIN_STATE_LABELS[state] ?? state ?? "Pending";
  const isSettled = state === "CHAIN_RESOLVED";
  const isFailed = state === "CHAIN_CANCELLED" || state === "CHAIN_FAILED";
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <div className={cn(
        "w-1.5 h-1.5 rounded-full",
        isSettled ? "bg-success shadow-[0_0_8px_hsl(var(--success))]" :
        isFailed ? "bg-error" :
        "bg-orange-400 animate-pulse"
      )} />
      <span className="font-medium tracking-tight uppercase">{label}</span>
    </div>
  );
}
