"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface DemoRealToggleProps {
  isDemoMode: boolean;
  onToggle: () => void;
  className?: string;
  variant?: "desktop" | "mobile";
}

export function DemoRealToggle({
  isDemoMode,
  onToggle,
  className,
  variant = "desktop",
}: DemoRealToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full bg-gray-900/80 border border-gray-800",
        variant === "desktop" ? "p-2" : "p-2",
        className
      )}
    >
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          !isDemoMode ? "text-white" : "text-gray-400",
          variant === "mobile" && "text-xs"
        )}
      >
        Real
      </span>
      <Switch
        checked={isDemoMode}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-red-600"
        style={variant === "mobile" ? { transform: "scale(0.75)" } : undefined}
      />
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          isDemoMode ? "text-white" : "text-gray-400",
          variant === "mobile" && "text-xs"
        )}
      >
        Demo
      </span>
    </div>
  );
}
