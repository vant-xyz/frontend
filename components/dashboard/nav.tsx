"use client";

import { cn } from "@/lib/utils";

interface DashboardNavProps {
  activeTab?: string;
  onTabChange?: (path: string, tabId: string) => void;
  className?: string;
  variant?: "desktop" | "mobile";
}

const navItems = [
  { id: "crypto", label: "Crypto", path: "/app" },
  { id: "vs", label: "VS", path: "/app/vs" },
  { id: "general", label: "General", path: "/app/general" },
  { id: "account", label: "Account", path: "/app/account" },
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

  return (
    <nav
      className={cn(
        "flex items-center gap-1 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-full p-1",
        variant === "mobile" && "justify-center",
        className
      )}
    >
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.path, item.id)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
            activeTab === item.id
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
