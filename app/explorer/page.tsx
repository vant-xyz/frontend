"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Loader } from "@/components/ui/loader";
import { History, Clock, ExternalLink, ChevronRight, HelpCircle } from "lucide-react";
import { getMarkets, getMarket, Market, MarketStatus } from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils";
import { ReelAnimation } from "@/components/landing/reel-animation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ExplorerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    fetchMarkets();
  }, [filterStatus]);

  const fetchMarkets = async () => {
    try {
      setIsLoading(true);
      const statusParam = filterStatus === "all" ? undefined : filterStatus;
      const res = await getMarkets(undefined, statusParam, undefined, 100);
      setMarkets(res.markets);
    } catch (err) {
      console.error("Failed to fetch markets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarketClick = async (marketId: string) => {
    try {
      const res = await getMarket(marketId);
      setSelectedMarket(res.market);
    } catch (err) {
      console.error("Failed to fetch market details:", err);
    }
  };

  const filteredMarkets = markets.filter((market) => {
    if (searchQuery && !market.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 h-20 px-4 lg:px-8 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push("/")}
        >
          <div className="w-8 h-8 bg-red-600 rounded transition-transform group-hover:scale-105 shadow-lg shadow-red-600/20"></div>
          <span className="text-xl font-bold text-white">VANT</span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/app/history")}
            className="h-10 w-10 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white"
          >
            <History size={20} />
          </Button>
          <Button
            onClick={() => router.push("/app")}
            className="bg-red-600 text-white hover:bg-red-500"
          >
            Back to App
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Hero Section */}
        <div className="mb-6">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
            <ReelAnimation texts={["Market Explorer", "OVM Explorer", "Onchain Markets"]} rotateInterval={3000} />
          </h1>
          <p className="text-gray-400 text-lg">
            Browse and analyze onchain verifiable markets
          </p>
        </div>

        {/* OVM Explanation Accordion */}
        <Accordion type="single" collapsible className="w-full mb-8">
          <AccordionItem value="what-are-ovms" className="border-white/10">
            <AccordionTrigger className="text-white hover:text-red-400">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-gray-400" />
                What are Onchain Verifiable Markets (OVMs)?
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-300 space-y-2">
              <p>
                OVMs are prediction markets whose entire lifecycle is recorded on the Solana blockchain.
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Market creation is recorded on-chain with a unique PDA (Program Derived Address)</li>
                <li>Settlement results are submitted and verified on-chain</li>
                <li>Anyone can verify market outcomes by checking the transaction on Solana explorers</li>
                <li>No hidden manipulation - all state transitions are publicly auditable</li>
              </ul>
              <p className="text-gray-400 pt-2">
                Each market below has onchain data you can verify via the Solana explorer links.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <Button
              variant="outline"
              className="w-full h-12 bg-black border-gray-800 text-gray-400 hover:text-white hover:bg-gray-900 justify-start"
              onClick={() => setIsSearchOpen(true)}
            >
              <span className="text-gray-500">Search markets...</span>
              <kbd className="ml-auto px-2 py-0.5 text-xs bg-gray-800 rounded">⌘K</kbd>
            </Button>
          </div>
          <div className="w-1/3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full h-12 px-4 bg-black border border-gray-800 rounded-md text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Market List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8" />
          </div>
        ) : filteredMarkets.length === 0 ? (
          <Card className="bg-black border-gray-800">
            <CardContent className="pt-6 text-center py-20">
              <p className="text-gray-400">No markets found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onClick={() => handleMarketClick(market.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Market Detail Modal */}
      {selectedMarket && (
        <MarketDetailModal
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
        />
      )}

      {/* Search Command Dialog */}
      <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} title="Search Markets" description="Find markets by title">
        <CommandInput
          placeholder="Type to search markets..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No markets found.</CommandEmpty>
          <CommandGroup>
            {filteredMarkets.map((market) => (
              <CommandItem
                key={market.id}
                onSelect={() => {
                  handleMarketClick(market.id);
                  setIsSearchOpen(false);
                }}
                className="cursor-pointer"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{market.title}</span>
                  <span className="text-xs text-gray-400">{market.market_type} • {market.status}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

interface MarketCardProps {
  market: Market;
  onClick: () => void;
}

function MarketCard({ market, onClick }: MarketCardProps) {
  const isActive = market.status === "active";
  const now = new Date();
  const endTime = new Date(market.end_time_utc);
  const timeUntilEnd = endTime.getTime() - now.getTime();

  const formatDuration = (ms: number) => {
    if (ms <= 0) return "Now";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours >= 24) return `${Math.floor(hours / 24)}d`;
    return `${hours}h`;
  };

  return (
    <Card
      className="bg-black border-gray-800 hover:border-red-600/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                {market.market_type}
              </Badge>
              <Badge variant={isActive ? "default" : "outline"} className="text-xs bg-green-600/20 text-green-400 border-green-600/50">
                {market.status}
              </Badge>
            </div>
            <CardTitle className="text-white text-lg line-clamp-2 group-hover:text-red-500 transition-colors">
              {market.title}
            </CardTitle>
          </div>
          <ChevronRight className="text-gray-600 group-hover:text-red-500 transition-colors flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-400 text-sm line-clamp-2 mb-4">
          {market.description}
        </CardDescription>

        {market.market_type === "CAPPM" && market.asset && (
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Asset:</span>
              <span className="text-white font-medium">{market.asset}</span>
            </div>
            {market.direction && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">Direction:</span>
                <span className={`font-medium ${market.direction === "Above" ? "text-green-500" : "text-red-500"}`}>
                  {market.direction}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={14} />
              <span>{isActive ? `Ends in ${formatDuration(timeUntilEnd)}` : `Ended ${formatTimeAgo(endTime.getTime() / 1000)}`}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {formatDuration(market.duration_seconds * 1000)} duration
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MarketDetailModalProps {
  market: Market;
  onClose: () => void;
}

function MarketDetailModal({ market, onClose }: MarketDetailModalProps) {
  const isCappm = market.market_type === "CAPPM";
  const isActive = market.status === "active";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-black border border-gray-800 rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-black border-b border-gray-800 p-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="border-gray-700 text-gray-400">
                {market.market_type}
              </Badge>
              <Badge variant={isActive ? "default" : "outline"} className="bg-green-600/20 text-green-400 border-green-600/50">
                {market.status}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-white">{market.title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
            <p className="text-white">{market.description}</p>
          </div>

          {/* Market Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Start Time</h3>
              <p className="text-white font-mono text-sm">
                {new Date(market.start_time_utc).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">End Time</h3>
              <p className="text-white font-mono text-sm">
                {new Date(market.end_time_utc).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Duration</h3>
              <p className="text-white font-mono text-sm">
                {Math.floor(market.duration_seconds / 3600)} hours
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Data Provider</h3>
              <p className="text-white font-mono text-sm">{market.data_provider}</p>
            </div>
          </div>

          {/* CAPPM Specific */}
          {isCappm && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Market Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Asset</h4>
                  <p className="text-white">{market.asset}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Direction</h4>
                  <p className={`font-medium ${market.direction === "Above" ? "text-green-500" : "text-red-500"}`}>
                    {market.direction}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Target Price</h4>
                  <p className="text-white font-mono">${(market.target_price! / 100).toFixed(2)}</p>
                </div>
                {market.current_price && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Current Price</h4>
                    <p className="text-white font-mono">${(market.current_price / 100).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resolution Details */}
          {!isActive && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Resolution</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Outcome</h4>
                  <Badge className={market.outcome === "YES" ? "bg-green-600" : "bg-red-600"}>
                    {market.outcome}
                  </Badge>
                </div>
                {market.end_price && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">End Price</h4>
                    <p className="text-white font-mono">${(market.end_price / 100).toFixed(2)}</p>
                  </div>
                )}
                {market.resolved_at && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Resolved At</h4>
                    <p className="text-white font-mono text-sm">
                      {new Date(market.resolved_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onchain Data */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ExternalLink size={18} />
              Onchain Data
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Market PDA</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-xs text-gray-300 font-mono break-all">
                    {market.market_pda}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://explorer.solana.com/address/${market.market_pda}?cluster=devnet`, "_blank")}
                    className="shrink-0"
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Creation TX</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-xs text-gray-300 font-mono break-all">
                    {market.creation_tx_hash}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://explorer.solana.com/tx/${market.creation_tx_hash}?cluster=devnet`, "_blank")}
                    className="shrink-0"
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </div>
              {market.settlement_tx_hash && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Settlement TX</h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-xs text-gray-300 font-mono break-all">
                      {market.settlement_tx_hash}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://explorer.solana.com/tx/${market.settlement_tx_hash}?cluster=devnet`, "_blank")}
                      className="shrink-0"
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Creator */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Creator</h4>
            <code className="text-xs text-gray-300 font-mono">{market.creator_address}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
