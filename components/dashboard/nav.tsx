"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Bitcoin,
  TrendingUp,
  LayoutGrid,
  User,
  History,
} from "lucide-react";

interface DashboardNavProps {
  activeTab?: string;
  onTabChange?: (path: string, tabId: string) => void;
  className?: string;
  variant?: "desktop" | "mobile";
}

const navItems = [
  { id: "crypto", label: "Crypto", path: "/app", icon: Bitcoin },
  { id: "vs", label: "VS", path: "/app/vs", icon: TrendingUp },
  { id: "general", label: "General", path: "/app/general", icon: LayoutGrid },
  { id: "account", label: "Account", path: "/app/account", icon: User },
] as const;

export function DashboardNav({
  activeTab = "crypto",
  onTabChange,
  className,
  variant = "desktop",
}: DashboardNavProps) {
  const handleClick = (path: string, tabId: string) => {
    onTabChange?.(path, tabId);
  };

  if (variant === "mobile") {
    return (
      <nav className={cn("flex items-center justify-around w-full", className)}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.path, item.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors py-1",
                isActive ? "text-red-600" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => handleClick(item.path, item.id)}
            className={cn(
              "h-10 px-4 gap-2 font-medium transition-all duration-200",
              isActive
                ? "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon size={18} />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
}
