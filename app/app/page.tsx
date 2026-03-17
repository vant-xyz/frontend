import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const cryptoCards = [
  { symbol: "BTC", name: "Bitcoin", color: "from-orange-500/20 to-orange-600/5" },
  { symbol: "ETH", name: "Ethereum", color: "from-blue-500/20 to-blue-600/5" },
  { symbol: "SOL", name: "Solana", color: "from-purple-500/20 to-purple-600/5" },
];

export default function DashboardPage() {
  return (
    <DashboardClient>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Welcome Section */}
        <section>
          <h1 className="text-2xl font-bold text-white mb-2">Crypto Dashboard</h1>
          <p className="text-gray-400 text-sm">
            Track your crypto predictions and manage your portfolio
          </p>
        </section>

        {/* Crypto Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cryptoCards.map((crypto) => (
            <Card
              key={crypto.symbol}
              className={cn(
                "bg-gradient-to-br border-gray-800 hover:border-gray-700 transition-all cursor-pointer",
                crypto.color
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{crypto.symbol.charAt(0)}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-400">{crypto.symbol}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{crypto.name}</h3>
                <p className="text-sm text-gray-500">Click to trade</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["Deposit", "Withdraw", "Swap", "History"].map((action) => (
              <button
                key={action}
                className="p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all text-center"
              >
                <p className="text-sm font-medium text-white">{action}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </DashboardClient>
  );
}
