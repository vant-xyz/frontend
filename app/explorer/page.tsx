"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Loader } from "@/components/ui/loader";
import { History, Clock, ExternalLink, ChevronRight, HelpCircle, Search, Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { getBalances, getTransactions, type BalancesData, type TransactionsData } from "@/lib/explorer-api";
import { getMarketsOnchain, getMarketOnchain, OnchainMarket, Market } from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils";
import { ReelAnimation } from "@/components/landing/reel-animation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ExplorerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [markets, setMarkets] = useState<OnchainMarket[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<OnchainMarket | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingMarketId, setPendingMarketId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
    fetchMarkets();
  }, [filterStatus]);

  const fetchMarkets = async () => {
    try {
      setIsLoading(true);
      const statusParam = filterStatus === "all" ? undefined : filterStatus;
      const res = await getMarketsOnchain(statusParam);
      const sorted = [...(res.markets || [])].sort((a, b) => b.StartTimeUTC - a.StartTimeUTC);
      setMarkets(sorted);
    } catch (err) {
      console.error("Failed to fetch markets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const marketId = new URLSearchParams(window.location.search).get("market");
    if (marketId) {
      setPendingMarketId(marketId);
    }
  }, []);

  useEffect(() => {
    if (!pendingMarketId || markets.length === 0) return;
    const match = markets.find((m) => m.MarketID === pendingMarketId);
    if (match) {
      setSelectedMarket(match);
      setPendingMarketId(null);
    }
  }, [pendingMarketId, markets]);

  useEffect(() => {
    if (!pendingMarketId) return;
    let active = true;
    getMarketOnchain(pendingMarketId)
      .then((res) => {
        if (!active) return;
        if (res?.onchain) {
          setSelectedMarket(res.onchain);
          setPendingMarketId(null);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pendingMarketId]);

  const handleMarketClick = (market: OnchainMarket) => {
    setSelectedMarket(market);
  };

  const filteredMarkets = markets.filter((market) => {
    if (searchQuery && !market.Title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredMarkets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedMarkets = filteredMarkets.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 h-20 px-4 lg:px-8 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push("/")}
        >
          <div className="w-8 h-8 bg-red-600 rounded transition-transform group-hover:scale-105 shadow-lg shadow-red-600/20"></div>
          <span className="text-xl font-bold text-white">Vantic</span>
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
          <a
            href="https://goldrush.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors w-fit"
          >
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Powered by</span>
            <img src="/media/images/attributions/goldrush-logo.png" alt="GoldRush" className="h-4 object-contain" />
          </a>
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
                OVMs are prediction markets whose entire lifecycle is recorded on the blockchain.
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Market creation is recorded on-chain for immutability and persistence</li>
                <li>Settlement results are submitted and are verifiable on-chain</li>
                <li>Anyone can verify market outcomes by checking the transaction on either the OVM explorer or Solana block explorers</li>
                <li>Due to the on-chain nature, Vantic markets ensures no hidden manipulation as all state transitions are publicly auditable</li>
              </ul>
              <p className="text-gray-400 pt-2">
                Each market below has onchain data you can verify via the Solana explorer links.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Wallet Portfolio (GoldRush) */}
        <WalletPortfolio />

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
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {paginatedMarkets.map((market) => (
                <MarketCard
                  key={market.MarketID}
                  market={market}
                  onClick={() => handleMarketClick(market)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) handlePageChange(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) handlePageChange(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
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
                key={market.MarketID}
                onSelect={() => {
                  handleMarketClick(market);
                  setIsSearchOpen(false);
                }}
                className="cursor-pointer"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{market.Title}</span>
                  <span className="text-xs text-gray-400">{market.MarketType === 0 ? "CAPPM" : "GEM"} • {!market.IsResolved ? "active" : "resolved"}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

function WalletPortfolio() {
  const [address, setAddress] = useState("");
  const [input, setInput] = useState("");
  const [balances, setBalances] = useState<BalancesData | null>(null);
  const [txs, setTxs] = useState<TransactionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"portfolio" | "transactions">("portfolio");

  const lookup = async (addr: string) => {
    if (!addr.trim()) return;
    setLoading(true);
    setError(null);
    setBalances(null);
    setTxs(null);
    setAddress(addr.trim());
    try {
      const [bal, txData] = await Promise.all([
        getBalances("solana-mainnet", addr.trim()),
        getTransactions("solana-mainnet", addr.trim()),
      ]);
      setBalances(bal);
      setTxs(txData);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch wallet data");
    } finally {
      setLoading(false);
    }
  };

  const totalUsd = balances?.items?.reduce((sum, t) => sum + (t.quote ?? 0), 0) ?? 0;

  return (
    <div className="mb-10 space-y-4">
      <div className="flex items-center gap-3">
        <Wallet size={18} className="text-red-500" />
        <h2 className="text-lg font-bold text-white">Wallet Explorer</h2>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup(input)}
          placeholder="Enter a Solana mainnet wallet address..."
          className="flex-1 h-12 px-4 bg-black border border-gray-800 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-red-600 transition-colors"
        />
        <Button
          onClick={() => lookup(input)}
          disabled={loading || !input.trim()}
          className="h-12 px-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl disabled:opacity-40"
        >
          {loading ? <Loader className="w-4 h-4" /> : <Search size={16} />}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {(balances || txs) && !loading && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
          {/* Summary bar */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Portfolio Value</p>
              <p className="text-2xl font-black text-white">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalUsd)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Address</p>
              <p className="text-xs text-gray-400 font-mono">{address.slice(0, 8)}…{address.slice(-6)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5">
            {(["portfolio", "transactions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  tab === t ? "text-white border-b-2 border-red-600" : "text-gray-600 hover:text-gray-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Portfolio tab */}
          {tab === "portfolio" && balances && (
            <div className="divide-y divide-white/5">
              {balances.items.length === 0 ? (
                <p className="px-5 py-8 text-center text-gray-600 text-sm">No tokens found</p>
              ) : (
                balances.items.map((token, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      {token.logo_url ? (
                        <img src={token.logo_url} alt={token.contract_ticker_symbol} className="w-8 h-8 rounded-full object-contain bg-white/5" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400">
                          {token.contract_ticker_symbol?.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-white">{token.contract_ticker_symbol}</p>
                        <p className="text-[10px] text-gray-500">{token.contract_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        {token.pretty_quote ?? `$${(token.quote ?? 0).toFixed(2)}`}
                      </p>
                      {token.quote_rate > 0 && (
                        <p className="text-[10px] text-gray-500">${token.quote_rate.toFixed(4)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Transactions tab */}
          {tab === "transactions" && txs && (
            <div className="divide-y divide-white/5">
              {txs.items.length === 0 ? (
                <p className="px-5 py-8 text-center text-gray-600 text-sm">No transactions found</p>
              ) : (
                txs.items.map((tx, i) => {
                  const isOut = tx.from_address?.toLowerCase() === address.toLowerCase();
                  return (
                    <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOut ? "bg-red-600/10" : "bg-green-600/10"}`}>
                          {isOut
                            ? <ArrowUpRight size={14} className="text-red-500" />
                            : <ArrowDownLeft size={14} className="text-green-500" />
                          }
                        </div>
                        <div>
                          <p className="text-xs font-mono text-gray-300">{tx.tx_hash.slice(0, 12)}…{tx.tx_hash.slice(-6)}</p>
                          <p className="text-[10px] text-gray-600">{new Date(tx.block_signed_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className={`text-[10px] font-bold uppercase ${tx.successful ? "text-green-500" : "text-red-500"}`}>
                            {tx.successful ? "Success" : "Failed"}
                          </p>
                          {tx.gas_quote != null && (
                            <p className="text-[10px] text-gray-600">Fee ${tx.gas_quote.toFixed(4)}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-gray-600 hover:text-white"
                          onClick={() => window.open(`https://explorer.solana.com/tx/${tx.tx_hash}`, "_blank")}
                        >
                          <ExternalLink size={12} />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MarketCardProps {
  market: OnchainMarket;
  onClick: () => void;
}

function MarketCard({ market, onClick }: MarketCardProps) {
  const isActive = !market.IsResolved;
  const now = new Date();
  const endTime = new Date(market.EndTimeUTC * 1000);
  const timeUntilEnd = endTime.getTime() - now.getTime();

  const formatDuration = (ms: number) => {
    if (ms <= 0) return "Now";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours >= 24) return `${Math.floor(hours / 24)}d`;
    return `${hours}h`;
  };

  const marketType = market.MarketType === 0 ? "CAPPM" : "GEM";
  const direction = market.Direction !== null ? (market.Direction === 0 ? "Above" : "Below") : null;

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
                {marketType}
              </Badge>
              <Badge variant={isActive ? "default" : "outline"} className={isActive ? "text-xs bg-green-600/20 text-green-400 border-green-600/50" : "text-xs bg-purple-600/20 text-purple-300 border-purple-500/50"}>
                {isActive ? "active" : "resolved"}
              </Badge>
            </div>
            <CardTitle className="text-white text-lg line-clamp-2 group-hover:text-red-500 transition-colors">
              {market.Title}
            </CardTitle>
          </div>
          <ChevronRight className="text-gray-600 group-hover:text-red-500 transition-colors flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-400 text-sm line-clamp-2 mb-4">
          {market.Description}
        </CardDescription>

        {marketType === "CAPPM" && market.Asset && (
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Asset:</span>
              <span className="text-white font-medium">{market.Asset}</span>
            </div>
            {direction && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">Direction:</span>
                <span className={`font-medium ${direction === "Above" ? "text-green-500" : "text-red-500"}`}>
                  {direction}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={14} />
              <span>{isActive ? `Ends in ${formatDuration(timeUntilEnd)}` : `Ended ${formatTimeAgo(market.EndTimeUTC)}`}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {formatDuration(market.DurationSeconds * 1000)} duration
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MarketDetailModalProps {
  market: OnchainMarket;
  onClose: () => void;
}

function MarketDetailModal({ market, onClose }: MarketDetailModalProps) {
  const isMobile = useIsMobile();
  const isCappm = market.MarketType === 0;
  const isActive = !market.IsResolved;

  const marketType = market.MarketType === 0 ? "CAPPM" : "GEM";
  const direction = market.Direction !== null ? (market.Direction === 0 ? "Above" : "Below") : null;
  const outcome = market.Outcome !== null ? (market.Outcome === 0 ? "YES" : "NO") : null;

  const [fullMarket, setFullMarket] = useState<Market | null>(null);
  const computedDuration = (() => {
    const seconds = Math.max(0, market.EndTimeUTC - market.StartTimeUTC);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  })();

  useEffect(() => {
    let active = true;
    getMarketOnchain(market.MarketID)
      .then((res) => {
        if (!active) return;
        setFullMarket(res.market);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [market.MarketID]);

  const marketPda = fullMarket?.market_pda || market.MarketID;
  const creatorAddress = fullMarket?.creator_address || market.Creator;
  const creationTxHash = fullMarket?.creation_tx_hash;
  const settlementTxHash = fullMarket?.settlement_tx_hash;
  const mbValidator = "MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e";
  const mbRpc = "devnet-eu.magicblock.app";

  const content = (
    <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-black border border-gray-800 rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-black border-b border-gray-800 p-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="border-gray-700 text-gray-400">
                {marketType}
              </Badge>
              <Badge variant={isActive ? "default" : "outline"} className={isActive ? "bg-green-600/20 text-green-400 border-green-600/50" : "bg-purple-600/20 text-purple-300 border-purple-500/50"}>
                {isActive ? "active" : "resolved"}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-white">{market.Title}</h2>
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
            <p className="text-white">{market.Description}</p>
          </div>

          {/* Market Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Start Time</h3>
              <p className="text-white font-mono text-sm">
                {new Date(market.StartTimeUTC * 1000).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">End Time</h3>
              <p className="text-white font-mono text-sm">
                {new Date(market.EndTimeUTC * 1000).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Duration</h3>
              <p className="text-white font-mono text-sm">
                {computedDuration}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Data Provider</h3>
              <p className="text-white font-mono text-sm">{market.DataProvider}</p>
            </div>
          </div>

          {/* CAPPM Specific */}
          {isCappm && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Market Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Asset</h4>
                  <p className="text-white">{market.Asset}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Direction</h4>
                  <p className={`font-medium ${direction === "Above" ? "text-green-500" : "text-red-500"}`}>
                    {direction}
                  </p>
                </div>
                {market.TargetPrice !== null && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Target Price</h4>
                    <p className="text-white font-mono">${(market.TargetPrice! / 100).toFixed(2)}</p>
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
                  <Badge className={outcome === "YES" ? "bg-green-600" : "bg-red-600"}>
                    {outcome}
                  </Badge>
                </div>
                {market.EndPrice !== null && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">End Price</h4>
                    <p className="text-white font-mono">${(market.EndPrice / 100).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onchain Data */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ExternalLink size={18} />
              Onchain Data (OVM)
            </h3>

            {/* Addresses */}
            <div className="space-y-3">
              {[
                { label: "Market PDA", value: marketPda },
                { label: "Creator", value: creatorAddress },
                { label: "Approved Settler", value: market.ApprovedSettler },
                { label: "Creation TX", value: creationTxHash || "N/A", isTx: true },
                { label: "Settlement TX", value: settlementTxHash || "N/A", isTx: true },
                { label: "MagicBlock RPC URL", value: mbRpc, isUrl: true },
                { label: "Validator Address", value: mbValidator },
              ].map(({ label, value }) => (
                <div key={label}>
                  <h4 className="text-sm font-medium text-gray-400 mb-2 inline-flex items-center gap-2">
                    {(label === "MagicBlock RPC URL" || label === "Validator Address") && (
                      <img src="/media/images/magicblock-icon.jpg" alt="MagicBlock" className="w-4 h-4 rounded-full object-cover" />
                    )}
                    {label}
                  </h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-xs text-gray-300 font-mono break-all">
                      {value}
                    </code>
                    {value !== "N/A" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = label.includes("TX")
                            ? `https://solscan.io/tx/${value}?cluster=devnet`
                            : label === "MagicBlock RPC URL"
                              ? `https://${value}`
                              : `https://solscan.io/account/${value}?cluster=devnet`;
                          window.open(url, "_blank");
                        }}
                        className="shrink-0"
                      >
                        <ExternalLink size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );

  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="bg-black border-white/10 p-0 max-h-[95vh]">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-transparent border-0 p-0 max-w-3xl">
        {content}
      </DialogContent>
    </Dialog>
  );
}
