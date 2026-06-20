"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Home, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectWalletButton } from "@/components/auth/connect-wallet-button";
import { useV2Auth } from "@/hooks/use-v2-auth";
import { GlowButton } from "@/components/ui/glow-button";

const navItems = [
  { id: "home", label: "Home", path: "/app", icon: Home },
  { id: "general", label: "General", path: "/app/general", icon: LayoutGrid },
] as const;

function short(pk: string) {
  return `${pk.slice(0, 4)}…${pk.slice(-4)}`;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { disconnect } = useWallet();
  const { walletPubkey, isV2 } = useV2Auth();
  const [, force] = useState(0);

  const activeId =
    pathname.startsWith("/app/general") ? "general" : "home";

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
    <div className="min-h-screen bg-[#0a0404] text-white selection:bg-red-500/30">
      {/* Grain overlay — matches landing page */}
      <div className="grain" aria-hidden="true" />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-red-900/8 blur-[140px]"
      />

      {/* Floating nav — matches landing nav pill */}
      <header className="fixed top-4 left-0 right-0 z-40 flex justify-center px-4">
        <nav className="w-full max-w-4xl flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-md border border-black rounded-2xl shadow-lg">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 rounded bg-red-600 shrink-0" />
            <span className="text-base font-bold text-white">Vantic</span>
          </div>

          {/* Desktop nav tabs */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-red-600/20 text-red-400 border border-red-600/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {isV2 && walletPubkey ? (
              <button
                onClick={handleLogout}
                title="Disconnect"
                className="px-4 py-2 rounded-[10px] border border-white/10 bg-white/[0.03] text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-colors font-mono"
              >
                {short(walletPubkey)}
              </button>
            ) : (
              <ConnectWalletButton
                className="px-4 py-2.5 rounded-[10px] bg-red-700 hover:bg-red-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-red-950/50"
                onAuthSuccess={() => window.location.reload()}
              />
            )}
          </div>

          {/* Mobile — hamburger placeholder; bottom nav handles routing */}
          <div className="lg:hidden flex items-center gap-2">
            {isV2 && walletPubkey ? (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-[8px] border border-white/10 text-[11px] text-zinc-300 font-mono"
              >
                {short(walletPubkey)}
              </button>
            ) : (
              <ConnectWalletButton
                className="px-3 py-2 rounded-[8px] bg-red-700 text-white font-semibold text-xs shadow-lg shadow-red-950/50"
                label="Connect"
                onAuthSuccess={() => window.location.reload()}
              />
            )}
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 pt-28 pb-32 lg:pb-12">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
        <div className="glass-card rounded-2xl p-2">
          <div className="flex items-center justify-around w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-8 rounded-[10px] transition-all duration-200",
                    active
                      ? "text-red-400 bg-red-600/10"
                      : "text-zinc-500 hover:text-zinc-300"
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
