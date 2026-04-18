"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDashboard } from "@/hooks/use-dashboard";
import { Loader } from "@/components/ui/loader";
import { DashboardNav } from "./nav";
import { BalanceWidget } from "./balance-widget";
import { BalanceModal } from "./balance-modal";
import { SellCryptoModal } from "./sell-crypto-modal";
import { PrivateDepositModal } from "./private-deposit-modal";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
  children: React.ReactNode;
}

export function DashboardClient({ children }: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    isLoading, 
    isSyncing, 
    error, 
    balance, 
    prices,
    isDemoMode, 
    toggleDemoReal, 
    sync, 
    fundDemo 
  } = useDashboard();
  
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isPrivateDepositOpen, setIsPrivateDepositOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("crypto");

  const totalBalance = isDemoMode ? balance?.total_demo_usd : balance?.total_usd;

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === "/app") setActiveTab("crypto");
    else if (pathname.startsWith("/app/vs")) setActiveTab("vs");
    else if (pathname.startsWith("/app/general")) setActiveTab("general");
    else if (pathname.startsWith("/app/account")) setActiveTab("account");
    else if (pathname.startsWith("/app/history")) setActiveTab("history");
  }, [pathname]);

  const handleNavClick = (path: string, tabId: string) => {
    setActiveTab(tabId);
    router.push(path);
  };

  const handleOpenSellModal = () => {
    setIsBalanceModalOpen(false);
    setIsSellModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader className="w-8 h-8 text-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <p className="text-gray-400 text-sm">Please refresh and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 h-20 px-4 lg:px-8 flex items-center justify-between">
        {/* Logo - Red Box */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => router.push("/")}
        >
          <div className="w-8 h-8 bg-red-600 rounded transition-transform group-hover:scale-105 shadow-lg shadow-red-600/20"></div>
        </div>

        {/* Right side: Desktop Nav + Balance + History */}
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="hidden lg:flex items-center gap-4">
            <DashboardNav activeTab={activeTab} onTabChange={handleNavClick} />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/app/history")}
              className={cn(
                "h-10 w-10 rounded-xl transition-all shadow-none",
                pathname === "/app/history" ? "bg-red-600 text-white" : "hover:bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              <History size={20} />
            </Button>
            <BalanceWidget 
              totalBalance={totalBalance ?? null} 
              onClick={() => setIsBalanceModalOpen(true)} 
              variant="desktop" 
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 lg:p-8 pb-32 lg:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
        <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black p-2">
          <DashboardNav activeTab={activeTab} onTabChange={handleNavClick} variant="mobile" />
        </div>
      </nav>

      <BalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        balance={balance}
        isDemoMode={isDemoMode}
        onToggle={toggleDemoReal}
        onSync={sync}
        onFundDemo={fundDemo}
        onOpenSell={handleOpenSellModal}
        onOpenPrivateDeposit={() => setIsPrivateDepositOpen(true)}
        isSyncing={isSyncing}
      />

      <PrivateDepositModal
        isOpen={isPrivateDepositOpen}
        onClose={() => setIsPrivateDepositOpen(false)}
      />

      <SellCryptoModal 
        isOpen={isSellModalOpen} 
        onClose={() => setIsSellModalOpen(false)}
        balance={balance}
        prices={prices}
        isDemoMode={isDemoMode}
        onSuccess={() => {
          // No manual sync needed, handled by WebSocket
        }}
      />
    </div>
  );
}
