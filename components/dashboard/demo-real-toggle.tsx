"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface DemoRealToggleProps {
  isDemoMode: boolean;
  onToggle: () => void;
  className?: string;
}

export function DemoRealToggle({
  isDemoMode,
  onToggle,
  className,
}: DemoRealToggleProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Label 
        htmlFor="mode-toggle" 
        className={cn(
          "text-[10px] font-bold uppercase tracking-widest transition-colors",
          isDemoMode ? "text-red-500" : "text-gray-500"
        )}
      >
        Demo Mode
      </Label>
      <Switch
        id="mode-toggle"
        checked={isDemoMode}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-red-600"
      />
    </div>
  );
}
