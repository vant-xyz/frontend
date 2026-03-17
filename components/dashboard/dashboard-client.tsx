"use client";

import { useState } from "react";
import { useDashboard } from "@/hooks/use-dashboard";
import { Loader } from "@/components/ui/loader";
import { DashboardNav } from "./nav";
import { BalanceWidget } from "./balance-widget";
import { DemoRealToggle } from "./demo-real-toggle";
import { BalanceModal } from "./balance-modal";

interface DashboardClientProps {
  children: React.ReactNode;
}

export function DashboardClient({ children }: DashboardClientProps) {
  const { isLoading, error, balance, isDemoMode, toggleDemoReal } = useDashboard();
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("crypto");

  const currentBalance = isDemoMode ? balance?.demo : balance?.real;
  const totalBalance = currentBalance?.total_ngn ?? null;

  const handleNavClick = (path: string, tabId: string) => {
    setActiveTab(tabId);
    window.location.href = path;
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
    <div className="min-h-screen bg-black">
      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-gray-800">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded"></div>
          <span className="text-2xl font-bold text-white">VANT</span>
        </div>

        {/* Desktop Nav + Balance + Toggle */}
        <div className="flex items-center gap-4">
          <BalanceWidget
            totalBalance={totalBalance}
            onClick={() => setIsBalanceModalOpen(true)}
            variant="desktop"
          />
          <DemoRealToggle
            isDemoMode={isDemoMode}
            onToggle={toggleDemoReal}
            variant="desktop"
          />
          <DashboardNav
            activeTab={activeTab}
            onTabChange={handleNavClick}
            variant="desktop"
          />
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <BalanceWidget
          totalBalance={totalBalance}
          onClick={() => setIsBalanceModalOpen(true)}
          variant="mobile"
        />
        <DemoRealToggle
          isDemoMode={isDemoMode}
          onToggle={toggleDemoReal}
          variant="mobile"
        />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 lg:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 px-4 py-3">
        <DashboardNav
          activeTab={activeTab}
          onTabChange={handleNavClick}
          variant="mobile"
        />
      </nav>

      {/* Balance Modal/Drawer */}
      <BalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        totalBalance={totalBalance}
        isDemoMode={isDemoMode}
        onToggle={toggleDemoReal}
      />
    </div>
  );
}
