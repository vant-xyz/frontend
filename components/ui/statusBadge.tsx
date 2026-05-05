
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'waiting':
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

export function ChainIndicator({ state }: { state: string }) {
  const isSynced = state === 'Synced' || state === 'Resolved On-Chain';
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <div className={cn(
        "w-1.5 h-1.5 rounded-full",
        isSynced ? "bg-success shadow-[0_0_8px_hsl(var(--success))]" : "bg-orange-400 animate-pulse"
      )} />
      <span className="font-medium tracking-tight uppercase">{state}</span>
    </div>
  );
}
