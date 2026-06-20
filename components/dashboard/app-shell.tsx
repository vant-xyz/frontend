"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Home, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectWalletButton } from "@/components/auth/connect-wallet-button";
import { useV2Auth } from "@/hooks/use-v2-auth";

const navItems = [
  { id: "home", label: "Home", path: "/app", icon: Home },
  { id: "general", label: "General", path: "/app/general", icon: LayoutGrid },
] as const;

function short(pk: string) {
  return `${pk.slice(0, 4)}…${pk.slice(-4)}`;
}

/**
 * v2 app shell: public browsing, wallet-based auth. No v1 token required.
 * Wallet connect lives in the header; trading is gated client-side downstream.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { disconnect } = useWallet();
  const { walletPubkey, isV2 } = useV2Auth();
  const [, force] = useState(0);

  const activeId =
    pathname.startsWith("/app/general") ? "general" : "home";

  // re-render after wallet auth writes to localStorage
  useEffect(() => {
    const onStorage = () => force((n) => n + 1);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
    disconnect().catch(() => {});
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 h-20 px-4 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push("/")}
        >
          <div className="w-8 h-8 bg-red-600 rounded transition-transform group-hover:scale-105 shadow-lg shadow-red-600/20" />
          <span className="text-lg font-bold hidden sm:block">Vantic</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={cn(
                  "h-10 px-4 gap-2 inline-flex items-center rounded-md font-medium transition-all duration-200",
                  active
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Wallet */}
        <div className="flex items-center gap-3">
          {isV2 && walletPubkey ? (
            <button
              onClick={handleLogout}
              title="Disconnect"
              className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-zinc-300 hover:text-white hover:border-white/20 transition-colors font-mono"
            >
              {short(walletPubkey)}
            </button>
          ) : (
            <ConnectWalletButton
              className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
              onAuthSuccess={() => window.location.reload()}
            />
          )}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-4 lg:p-8 pb-32 lg:pb-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
        <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black p-2">
          <div className="flex items-center justify-around w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-colors py-1 px-6",
                    active ? "text-red-600" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
