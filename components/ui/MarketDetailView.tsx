"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Market, getOrderbook, OrderbookSnapshot,
    placeOrder, OrderSide, OrderType,
    getMarket,
    Trades,
    getTrades,
    getMarketVolume,
    MarketVolume,
    BalanceInfo,
    getBalance,
    getTokenPrices,
    Position,
    getUserPositions,
    Order,
    getUserOrders,
    cancelOrder,
    closePosition,
    SellPositionRequest,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Search, ChevronUp, ChevronDown, ExternalLink, BarChart2, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { QuickTradeModal } from "../../components/dashboard/crypto/quick-trade-modal";
import { Loader } from "@/components/ui/loader";
import { OpinionTrendChart } from "@/components/ui/OpinionTrendChart";
import { CandlestickChart } from "@/components/ui/CandlestickChart";
import { useParams, useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/use-dashboard";
import { SharePositionModal } from "./sharePositionModal";
import { usePriceFeed } from "@/hooks/use-price-feed";

export default function MarketDetailView() {
    const { id } = useParams()
    const [market, setMarket] = useState<Market | null>(null);
    const [balance, setBalance] = useState<BalanceInfo | null>(null);
    const [tokenUsdMap, setTokenUsdMap] = useState<Record<string, number>>({});
    const [marketTrades, setMarketTrades] = useState<Trades[] | null>(null)
    const [marketVolume, setMarketVolume] = useState<MarketVolume | null>(null);
    const [userOrders, setUserOrders] = useState<Order[] | null>(null)
    const [loadingOrders, setIsLoadingOrders] = useState(false);
    const [positions, setPositions] = useState<Position[] | null>(null);
    const [loadingPositions, setIsLoadingPositions] = useState(false);
    const [loadingMarket, setLoadingMarket] = useState(true);
    const [loadingMarketTrades, setLoadingMarketTrades] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orderbook, setOrderbook] = useState<OrderbookSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [orderMode, setOrderMode] = useState<"BUY" | "SELL">("BUY");
    const [orderType, setOrderType] = useState<OrderType>("MARKET");
    const [selectedSide, setSelectedSide] = useState<OrderSide>("YES");
    const [limitPrice, setLimitPrice] = useState(() => {
        return "50";
    });
    const [quantity, setQuantity] = useState("0");
    const [inputMode, setInputMode] = useState<"shares" | "usd">("shares");
    const [usdAmount, setUsdAmount] = useState<string>("");
    const [isOrderInputFocused, setIsOrderInputFocused] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showClosePositionModal, setShowClosePositionModal] = useState(false);
    const [positionToClose, setPositionToClose] = useState<Position | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ seconds: number; text: string }>({ seconds: 0, text: "" });
    const [mobileTab, setMobileTab] = useState<"chart" | "book" | "order">("chart");
    const [chartType, setChartType] = useState<"opinion" | "candlestick">("opinion");
    const [sharePosition, setSharePosition] = useState<{
        pos: Position;
        pnl: number;
        pnlPct: number;
        avgPriceCents: number;
        currentPriceCents: number;
    } | null>(null);

    const handleSharePosition = (pos: Position, pnl: number, pnlPct: number, currentPriceCents: number, avgPriceCents: number) => {
        setSharePosition({ pos, pnl, pnlPct, avgPriceCents, currentPriceCents });
    };
    const token = localStorage.getItem("auth_token");
    const { isDemoMode } = useDashboard();
    const { prices } = usePriceFeed({ usePolling: true, pollingInterval: 1000 });
    const router = useRouter();
    const goBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
        }
        router.push("/app/general");
    };


    useEffect(() => {
        if (!id || !token) return
        const fetchUserOrders = async () => {
            try {
                setIsLoadingOrders(true);
                const data = await getUserOrders(token, id as string);
                setUserOrders(data.orders);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch positions");
            } finally {
                setIsLoadingOrders(false);
            }
        };
        fetchUserOrders();
    }, [id, token])

    const fetchUserPositions = useCallback(async () => {
        if (!token || !id) return;
        try {
            const data = await getUserPositions(token, id as string);
            setPositions(data.positions);
        } catch (err) {
            console.error(err);
        } finally {
        }
    }, [token, id]);

    const fetchOpenOrders = useCallback(async () => {
        if (!token || !id) return;
        try {
            const data = await getUserOrders(token, id as string);
            setUserOrders(data.orders || []);
        } catch (err) {
            console.error(err);
            setUserOrders([]);
        } finally {
        }
    }, [token, id]);

    useEffect(() => {
        if (!id || !token) return;
        fetchUserPositions();
        fetchOpenOrders();
        const interval = setInterval(() => {
            if (isOrderInputFocused) return;
            fetchUserPositions();
            fetchOpenOrders();
        }, 1000);

        return () => clearInterval(interval);
    }, [id, token, fetchUserPositions, fetchOpenOrders, isOrderInputFocused]);

    console.log("positions", positions)

    useEffect(() => {
        if (!id) return
        const fetchMarketTrades = async () => {
            try {
                if (!marketTrades) setLoadingMarketTrades(true);
                const data = await getTrades(id as string);
                setMarketTrades(data.trades);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Failed to load market");
            } finally {
                setLoadingMarketTrades(false);
            }
        };
        fetchMarketTrades();
        const interval = setInterval(() => {
            if (isOrderInputFocused) return;
            fetchMarketTrades();
        }, 1000);
        return () => clearInterval(interval);
    }, [id, marketTrades, isOrderInputFocused])

    useEffect(() => {
        if (!id) return;

        let mounted = true;
        const fetchMarket = async () => {
            try {
                const data = await getMarket(id as string);
                if (mounted) {
                    setMarket(data.market);
                    setError(null);
                }
            } catch (err) {
                console.error(err);
                if (mounted) setError("Failed to load market");
            } finally {
                if (mounted) setLoadingMarket(false);
            }
        };

        const fetchVolume = async () => {
            try {
                const res = await getMarketVolume(id as string);
                if (mounted) setMarketVolume(res.volume);
            } catch {
                if (mounted) setMarketVolume(null);
            }
        };

        fetchMarket();
        fetchVolume();
        const interval = setInterval(() => {
            if (isOrderInputFocused) return;
            fetchMarket();
            fetchVolume();
        }, 1000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [id, isOrderInputFocused]);

    useEffect(() => {
        if (!token) return;
        const fetchBalance = async () => {
            try {
                const res = await getBalance(token)
                setBalance(res.balance)
                console.log(token)
                console.log(balance)
            } catch (error) {
                setBalance(null)
                console.log(balance)
            }
        };

        fetchBalance()
    }, [token])

    useEffect(() => {
        let active = true;
        const loadTokenUsd = async () => {
            try {
                const res = await getTokenPrices(["SOL", "USDC", "USDT", "USDG", "ETH"]);
                if (active) setTokenUsdMap(res.prices || {});
            } catch {
                if (active) setTokenUsdMap({});
            }
        };
        loadTokenUsd();
        const i = setInterval(loadTokenUsd, 10000);
        return () => {
            active = false;
            clearInterval(i);
        };
    }, []);


    const loadOrderbook = useCallback(async () => {
        if (!market?.id) return;
        try {
            const res = await getOrderbook(market.id);
            setOrderbook(res.orderbook);
        } catch (err) {
            console.error("Failed to load orderbook:", err);
        } finally {
            setLoading(false);
        }
    }, [market?.id]);

    useEffect(() => {
        if (!market?.id) return
        loadOrderbook();
        const i = setInterval(() => {
            if (isOrderInputFocused) return;
            loadOrderbook();
        }, 500);
        return () => clearInterval(i);
    }, [market?.id, loadOrderbook, isOrderInputFocused]);

    useEffect(() => {
        if (!market?.id) return;
        const tick = () => {
            const diff = new Date(market.end_time_utc).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft({ seconds: 0, text: "Expired" });
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft({ seconds: diff / 1000, text: `${m}:${s.toString().padStart(2, "0")}` });
            }
        };
        tick();
        const i = setInterval(tick, 1000);
        return () => clearInterval(i);
    }, [market?.end_time_utc]);
    const toCents = (v?: number) => {
        const n = Number(v ?? 0);
        if (!Number.isFinite(n)) return 0;
        return n <= 1 ? n * 100 : n;
    };
    const lastYes = toCents(orderbook?.yes_bids?.[0]?.price) || toCents(orderbook?.last_traded_price) || 50;
    const lastNo = toCents(orderbook?.no_asks?.[0]?.price) || Math.max(0, 100 - lastYes);

    useEffect(() => {
        if (orderType === "LIMIT") {
            const defaultPrice = selectedSide === "YES"
                ? lastYes.toFixed(1)
                : lastNo.toFixed(1);
            setLimitPrice(defaultPrice);
        }
    }, [selectedSide, orderType, lastYes, lastNo]);
    const handleOrderTypeChange = (t: OrderType) => {
        setOrderType(t);
        if (t === "LIMIT") {
            const defaultPrice = selectedSide === "YES"
                ? lastYes.toFixed(1)
                : lastNo.toFixed(1);
            setLimitPrice(defaultPrice);
        }
    };



    if (loadingMarket) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="w-10 h-10 text-red-600" />
            </div>
        );
    }
    if (error) {
        return <div className="text-red-500 p-8">Error: {error}</div>;
    }

    if (!market) {
        return (
            <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                        <span className="text-5xl">🤔</span>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-3">Market Not Found</h2>
                    <p className="text-gray-400 mb-8 text-lg">
                        We couldn't find any market with that ID.
                    </p>

                    <button
                        type="button"
                        onClick={goBack}
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-2xl transition-all active:scale-95"
                    >
                        ← Return to Markets
                    </button>
                </div>
            </div>
        );
    }

    const handleCancelOrder = (orderId: string) => {
        setOrderToCancel(orderId);
        setShowCancelModal(true);
    };

    const handleClosePosition = (pos: Position) => {
        setPositionToClose(pos);
        setShowClosePositionModal(true);
    };

    const currentPriceCents = toCents(orderbook?.last_traded_price) || lastYes;
    const lastTradedPrice = orderbook?.last_traded_price ?? currentPriceCents;
    const isSettling = timeLeft.seconds <= 0;
    const isUrgent = timeLeft.seconds > 0 && timeLeft.seconds <= 20;
    const isResolved = market?.status === "resolved";

    const displayStatus = isResolved ? "Resolved" : isSettling ? "Settling" : "Active";

    const pricePerShareDollars = (selectedSide === "YES" ? lastYes : lastNo) / 100;
    const liveAssetPrice = (() => {
        const asset = (market.asset || "").toUpperCase() as keyof typeof prices;
        const p = prices[asset];
        const n = p?.price ? Number(p.price) : NaN;
        return Number.isFinite(n) && n > 0 ? n : null;
    })();
    const tradingBalance = isDemoMode ? (balance?.demo_naira ?? 0) : (balance?.naira ?? 0);
    const cumulativeAssetUsd = (() => {
        if (!balance) return 0;
        if (isDemoMode) {
            const solPx = tokenUsdMap.SOL ?? 0;
            const usdcPx = tokenUsdMap.USDC ?? 1;
            return (balance.demo_sol ?? 0) * solPx + (balance.demo_usdc_sol ?? 0) * usdcPx + (balance.demo_naira ?? 0);
        }
        const solPx = tokenUsdMap.SOL ?? 0;
        const usdcPx = tokenUsdMap.USDC ?? 1;
        const usdtPx = tokenUsdMap.USDT ?? 1;
        const usdgPx = tokenUsdMap.USDG ?? 1;
        const ethPx = tokenUsdMap.ETH ?? 0;
        return (balance.sol ?? 0) * solPx +
            (balance.wsol ?? 0) * solPx +
            (balance.usdc_sol ?? 0) * usdcPx +
            (balance.usdc_base ?? 0) * usdcPx +
            (balance.usdt_sol ?? 0) * usdtPx +
            (balance.usdg_sol ?? 0) * usdgPx +
            (balance.eth_base ?? 0) * ethPx +
            (balance.naira ?? 0) +
            (balance.vusd ?? 0);
    })();
    const effectiveQuantity = inputMode === "shares"
        ? (parseFloat(quantity) || 0)
        : (parseFloat(usdAmount) || 0) / (pricePerShareDollars > 0 ? pricePerShareDollars : 1);
    const sharesTotal = effectiveQuantity * pricePerShareDollars;
    const youReceive = effectiveQuantity * 1.00;

    const handlePlaceOrder = async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (!token) { toast.error("Please login to trade"); return; }
        if (!effectiveQuantity || effectiveQuantity <= 0) { toast.error("Enter a valid quantity"); return; }
        try {
            setSubmitting(true);
            await placeOrder(token, {
                market_id: market.id,
                side: selectedSide,
                type: orderType,
                price: orderType === "LIMIT" ? parseFloat(limitPrice) / 100 : undefined,
                quantity: effectiveQuantity,
                is_demo: isDemoMode
            });
            toast.success("Order placed!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to place order");
        } finally {
            setSubmitting(false);
        }
    };

    const orderbookPanel = (() => {
        const bids = orderbook?.yes_bids || [];
        const asks = orderbook?.yes_asks || [];
        const sortedBids = [...bids].sort((a, b) => b.price - a.price).slice(0, 12);
        const sortedAsks = [...asks].sort((a, b) => a.price - b.price).slice(0, 12);

        let cum = 0;
        const asksD = sortedAsks.map(a => { cum += a.quantity; return { ...a, cum }; });
        cum = 0;
        const bidsD = sortedBids.map(b => { cum += b.quantity; return { ...b, cum }; });
        const maxD = Math.max(...asksD.map(a => a.cum), ...bidsD.map(b => b.cum), 1);
        const mid = sortedBids[0] && sortedAsks[0]
            ? ((sortedBids[0].price + sortedAsks[0].price) / 2).toFixed(1)
            : "--";

        return (
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/8">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Order Book</span>
                    <div className="flex gap-2 text-[10px] font-mono">
                        <span className="text-green-400">YES {lastYes.toFixed(1)}¢</span>
                        <span className="text-gray-600">·</span>
                        <span className="text-red-400">NO {lastNo.toFixed(1)}¢</span>
                    </div>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-3 px-4 py-1.5 text-[10px] text-gray-600 font-mono border-b border-white/5">
                    <span>Price</span><span className="text-center">Size</span><span className="text-right">Total</span>
                </div>

                {/* Asks */}
                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-8"><Loader className="w-4 h-4 text-red-500" /></div>
                    ) : (
                        <>
                            {asksD.slice().reverse().map((a, i) => (
                                <div key={i} className="relative grid grid-cols-3 px-4 py-[2px] hover:bg-white/3 cursor-pointer">
                                    <div className="absolute right-0 top-0 h-full bg-red-500/12" style={{ width: `${(a.cum / maxD) * 100}%` }} />
                                    <span className="text-red-400 text-[11px] font-mono z-10">{a.price.toFixed(1)}¢</span>
                                    <span className="text-center text-gray-300 text-[11px] font-mono z-10">{a.quantity.toLocaleString()}</span>
                                    <span className="text-right text-gray-500 text-[11px] font-mono z-10">{a.cum.toLocaleString()}</span>
                                </div>
                            ))}

                            {/* Mid spread */}
                            <div className="grid grid-cols-3 px-4 py-2 border-y border-white/10 bg-white/3">
                                <span className="text-white text-xs font-mono font-semibold col-span-2">{mid}¢</span>
                                <span className="text-right text-gray-600 text-[10px]">spread</span>
                            </div>

                            {bidsD.map((b, i) => (
                                <div key={i} className="relative grid grid-cols-3 px-4 py-[2px] hover:bg-white/3 cursor-pointer">
                                    <div className="absolute right-0 top-0 h-full bg-green-500/12" style={{ width: `${(b.cum / maxD) * 100}%` }} />
                                    <span className="text-green-400 text-[11px] font-mono z-10">{b.price.toFixed(1)}¢</span>
                                    <span className="text-center text-gray-300 text-[11px] font-mono z-10">{b.quantity.toLocaleString()}</span>
                                    <span className="text-right text-gray-500 text-[11px] font-mono z-10">{b.cum.toLocaleString()}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-4 px-4 py-3 border-t border-white/8 bg-white/3">
                    <button
                        onClick={() => {
                            setSelectedSide("YES");
                            setOrderMode("BUY");
                            setMobileTab("order");
                        }}
                        className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", "bg-green-500/15 text-green-400 hover:bg-green-500/25")}
                    >
                        YES {lastYes.toFixed(1)}¢
                    </button>
                    <button
                        onClick={() => {
                            setSelectedSide("NO");
                            setOrderMode("BUY");
                            setMobileTab("order");
                        }}
                        className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", "bg-red-500/15 text-red-400 hover:bg-red-500/25")}
                    >
                        NO {lastNo.toFixed(1)}¢
                    </button>
                </div>
            </div>
        );
    })();

    const orderForm = (
        <div className="flex flex-col h-full">
            {/* Buy / Sell + Market type */}
            <div className="p-4 border-b border-white/8 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                        {(["BUY", "SELL"] as const).map(m => (
                            <button key={m} onClick={() => setOrderMode(m)}
                                className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    orderMode === m ? "bg-white/15 text-white" : "text-gray-500 hover:text-gray-300"
                                )}>
                                {m}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                        {(["MARKET", "LIMIT"] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => handleOrderTypeChange(t)}
                                className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                                    orderType === t ? "bg-white/15 text-white" : "text-gray-500 hover:text-gray-300"
                                )}>
                                {t.charAt(0) + t.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* YES / NO */}
                <div className="grid grid-cols-2 rounded-xl overflow-hidden bg-white/5 p-1 gap-1">
                    <button onClick={() => setSelectedSide("YES")}
                        className={cn("py-2.5 rounded-lg text-sm font-bold transition-all",
                            selectedSide === "YES" ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-gray-400 hover:text-white"
                        )}>
                        Yes {lastYes.toFixed(1)}¢
                    </button>
                    <button onClick={() => setSelectedSide("NO")}
                        className={cn("py-2.5 rounded-lg text-sm font-bold transition-all",
                            selectedSide === "NO" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-gray-400 hover:text-white"
                        )}>
                        No {lastNo.toFixed(1)}¢
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {/* Limit price input */}
                {orderType === "LIMIT" && (
                    <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Limit Price (¢)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setLimitPrice(p => Math.max(0.1, parseFloat(p) - 0.1).toFixed(1))}
                                className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 text-gray-300 flex items-center justify-center transition-colors">
                                <ChevronDown size={14} />
                            </button>
                            <Input
                                type="number"
                                value={limitPrice}
                                onChange={e => setLimitPrice(e.target.value)}
                                className="flex-1 text-center text-xl font-mono font-semibold bg-transparent border-0 text-white h-auto p-0 focus-visible:ring-0"
                            />
                            <button onClick={() => setLimitPrice(p => Math.min(99.9, parseFloat(p) + 0.1).toFixed(1))}
                                className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 text-gray-300 flex items-center justify-center transition-colors">
                                <ChevronUp size={14} />
                            </button>
                        </div>
                    </div>
                )}


                {/* Shares */}
                <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Order Size</span>
                        <span className="text-[10px] text-gray-400">
                            Balance ${tradingBalance.toFixed(2)} (${cumulativeAssetUsd.toFixed(2)} assets)
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 mb-3">
                        <button
                            onClick={() => setInputMode("shares")}
                            className={cn(
                                "py-1.5 rounded-lg text-xs font-semibold transition-colors",
                                inputMode === "shares" ? "bg-white/15 text-white" : "bg-white/5 text-gray-400 hover:text-gray-200"
                            )}
                        >
                            Shares
                        </button>
                        <button
                            onClick={() => setInputMode("usd")}
                            className={cn(
                                "py-1.5 rounded-lg text-xs font-semibold transition-colors",
                                inputMode === "usd" ? "bg-white/15 text-white" : "bg-white/5 text-gray-400 hover:text-gray-200"
                            )}
                        >
                            USD
                        </button>
                    </div>

                    <div className="mb-3 flex items-stretch gap-1">
                        <Input
                            type="number"
                            value={inputMode === "shares" ? quantity : usdAmount}
                            onChange={(e) => {
                                if (inputMode === "shares") {
                                    setQuantity(e.target.value);
                                    return;
                                }
                                setUsdAmount(e.target.value);
                            }}
                            onFocus={() => setIsOrderInputFocused(true)}
                            onBlur={() => setIsOrderInputFocused(false)}
                            className="flex-1 bg-white/5 border-white/10 text-white h-11 font-mono"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                        />
                        <div className="flex flex-col gap-0.5">
                            <button
                                type="button"
                                onClick={() => {
                                    if (inputMode === "shares") {
                                        setQuantity(String(Math.max(0, (parseFloat(quantity) || 0) + 1)));
                                    } else {
                                        setUsdAmount((Math.max(0, (parseFloat(usdAmount) || 0) + 1)).toFixed(2));
                                    }
                                }}
                                className="flex-1 w-8 rounded-md bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                            >
                                <ChevronUp size={12} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (inputMode === "shares") {
                                        setQuantity(String(Math.max(0, (parseFloat(quantity) || 0) - 1)));
                                    } else {
                                        setUsdAmount((Math.max(0, (parseFloat(usdAmount) || 0) - 1)).toFixed(2));
                                    }
                                }}
                                className="flex-1 w-8 rounded-md bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                            >
                                <ChevronDown size={12} />
                            </button>
                        </div>
                    </div>

                    {/* 25% 50% MAX Buttons */}
                    <div className="flex gap-1.5">
                        {["25%", "50%", "MAX"].map((label) => (
                            <button
                                key={label}
                                onClick={() => {
                                    const pricePerShare = selectedSide === "YES" ? lastYes / 100 : lastNo / 100;
                                    if (pricePerShare <= 0) return;

                                    const userBalance = tradingBalance;

                                    const maxAffordable = Math.floor(userBalance / pricePerShare);

                                    if (label === "25%") {
                                        const q = Math.max(0, Math.floor(maxAffordable * 0.25));
                                        inputMode === "shares" ? setQuantity(String(q)) : setUsdAmount(String((q * pricePerShare).toFixed(2)));
                                    } else if (label === "50%") {
                                        const q = Math.max(0, Math.floor(maxAffordable * 0.5));
                                        inputMode === "shares" ? setQuantity(String(q)) : setUsdAmount(String((q * pricePerShare).toFixed(2)));
                                    } else {
                                        const q = Math.max(0, maxAffordable);
                                        inputMode === "shares" ? setQuantity(String(q)) : setUsdAmount(String((q * pricePerShare).toFixed(2)));
                                    }
                                }}
                                className="flex-1 py-1.5 text-[10px] font-semibold border border-white/10 rounded-lg text-gray-400 hover:border-white/25 hover:text-gray-200 transition-colors"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Total Cost</span>
                        <span className="text-white font-mono">${sharesTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">You'll receive</span>
                        <span className="text-teal-400 text-lg font-mono font-semibold">${youReceive.toFixed(2)}</span>
                    </div>
                </div>

                {/* CTA */}
                <button onClick={handlePlaceOrder} disabled={submitting || effectiveQuantity <= 0}
                    className={cn(
                        "w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        orderMode === "SELL"
                            ? "bg-white text-black hover:bg-gray-100"
                            : selectedSide === "YES"
                                ? "bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/20"
                                : "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20"
                    )}>
                    {submitting
                        ? <Loader className="mx-auto" />
                        : `${orderMode === "SELL" ? "Sell" : "Buy"} ${selectedSide} · ${effectiveQuantity.toFixed(3)} shares`}
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className="h-screen bg-[#0a0a0a] text-white flex flex-col mx-auto overflow-hidden">

                {/* ── Top bar ─────────────────────────────────────────────────────── */}
                <div
                    className="flex items-start gap-3 px-4 lg:px-6 py-4 border-b border-white/8 relative overflow-hidden"
                    style={market.market_type === "GEM" && market.market_image_banner ? {
                        backgroundImage: `linear-gradient(rgba(0,0,0,.65), rgba(0,0,0,.85)), url(${market.market_image_banner})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                    } : undefined}
                >
                    <button onClick={goBack}
                        className="mt-0.5 p-1.5 rounded-lg hover:bg-white/8 transition-colors text-gray-500 hover:text-white shrink-0">
                        <ArrowLeft size={17} />
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base lg:text-lg font-semibold text-white leading-snug">{market.title}</h1>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs">
                            <span className="text-green-400 font-mono font-semibold">Yes {lastYes.toFixed(1)}¢</span>
                            <span className="text-red-400 font-mono font-semibold">No {lastNo.toFixed(1)}¢</span>
                            <span className="text-gray-500">
                                Vol <span className="text-gray-300">${(marketVolume?.volume ?? 0).toFixed(2)}</span>
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                                <Clock size={10} />
                                <span className={cn("font-mono", isResolved ? "text-emerald-400" : isSettling ? "text-yellow-400" : "text-gray-300")}>
                                    {isResolved ? "Resolved" : isSettling ? "Settling" : timeLeft.text}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Top bar badge */}
                    <Badge className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border-0 shrink-0",
                        market.status === "resolved"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : isSettling
                                ? "bg-yellow-500/15 text-yellow-400"
                                : "bg-green-500/15 text-green-400"
                    )}>
                        {market.status === "resolved"
                            ? "Resolved"
                            : isSettling
                                ? "Settling"
                                : "Active"
                        }
                    </Badge>
                    <div className="ml-2 text-right shrink-0">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Current</p>
                        <p className="text-lg font-mono text-white">{market.market_type === "CAPPM" ? `$${(liveAssetPrice ?? ((market.current_price ?? 0) / 100)).toFixed(2)}` : `${currentPriceCents.toFixed(1)}¢`}</p>
                    </div>
                </div>

                {/* ── Mobile tab switcher ──────────────────────────────────────────── */}
                <div className="flex lg:hidden border-b border-white/8">
                    {(["chart", "book", "order"] as const).map(t => (
                        <button key={t} onClick={() => setMobileTab(t)}
                            className={cn(
                                "flex-1 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2",
                                mobileTab === t
                                    ? "border-white text-white"
                                    : "border-transparent text-gray-500 hover:text-gray-300"
                            )}>
                            {t === "book" ? "Order Book" : t === "order" ? "Trade" : "Chart"}
                        </button>
                    ))}
                </div>

                {/* ── Desktop 3-col / Mobile tabbed ────────────────────────────────── */}
                <div className="flex flex-1 overflow-hidden gap-2 bg-[#111] p-2">

                    {/* LEFT — Chart + tabs (desktop always visible, mobile only when tab=chart) */}
                    <div className={cn(
                        "flex flex-col flex-1 rounded-xl min-w-0 overflow-hidden",
                        "lg:flex",
                        mobileTab === "chart" ? "flex" : "hidden lg:flex"
                    )}>
                        {/* Chart */}
                        <div className="">
                            {market.market_type === "GEM" || chartType === "opinion" ? (
                                <OpinionTrendChart
                                    marketId={market.id}
                                    title="YES / NO Sentiment"
                                    forcedYesCents={lastYes}
                                    forcedNoCents={lastNo}
                                    leftSlot={market.market_type === "CAPPM" ? (
                                        <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1 bg-black/40">
                                            <button
                                                onClick={() => setChartType("opinion")}
                                                className={cn("p-1 rounded-md transition-colors", chartType === "opinion" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white")}
                                                title="Trend chart"
                                            >
                                                <LineChart size={14} />
                                            </button>
                                            <button
                                                onClick={() => setChartType("candlestick")}
                                                className={cn("p-1 rounded-md transition-colors", chartType === "candlestick" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white")}
                                                title="Candlestick chart"
                                            >
                                                <BarChart2 size={14} />
                                            </button>
                                        </div>
                                    ) : null}
                                />
                            ) : (
                                <CandlestickChart
                                    marketId={market.id}
                                    title={`${market.asset || "Asset"} Spot Price`}
                                    leftSlot={(
                                        <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1 bg-black/40">
                                            <button
                                                onClick={() => setChartType("opinion")}
                                                className={cn("p-1 rounded-md transition-colors", chartType === "opinion" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white")}
                                                title="Trend chart"
                                            >
                                                <LineChart size={14} />
                                            </button>
                                            <button
                                                onClick={() => setChartType("candlestick")}
                                                className={cn("p-1 rounded-md transition-colors", chartType === "candlestick" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white")}
                                                title="Candlestick chart"
                                            >
                                                <BarChart2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                />
                            )}
                        </div>

                        {/* Bottom tabs */}
                        <Tabs defaultValue="positions" className="flex-1 border-[1px] rounded-2xl flex flex-col min-h-0 overflow-hidden mt-2">
                            <div className=" px-4 bg-white/[0.02]">
                                <TabsList className="bg-transparent gap-1 rounded-none h-auto p-0">
                                    {["positions", "trades", "open"].map(tab => (
                                        <TabsTrigger key={tab} value={tab}
                                            className={cn(
                                                "text-xs px-3 py-3 rounded-none border-b-2 border-transparent capitalize",
                                                "data-[state=active]:border-b-white data-[state=active]:text-white data-[state=active]:bg-transparent",
                                                "text-gray-500 hover:text-gray-300 transition-colors"
                                            )}>
                                            {tab === "open" ? "Open Orders" : tab}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            {/* Positions Tab */}
                            <TabsContent value="positions" className="flex-1 overflow-y-auto p-4 scrollbar-hide min-h-0">
                                {loadingPositions ? (
                                    <div className="flex h-full items-center justify-center py-12">
                                        <Loader className="w-6 h-6 text-red-600" />
                                    </div>
                                ) : !positions || positions.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                                            <span className="text-4xl">📭</span>
                                        </div>
                                        <p className="text-gray-400 text-lg">No positions yet</p>
                                        <p className="text-gray-600 text-sm mt-2 max-w-[240px]">
                                            When you successfully fill an order, it will appear here
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {positions.map((pos, i) => {
                                            const avgPriceCents = (pos.avg_entry_price || 0) * 100;

                                            const costBasis = pos.shares * (pos.avg_entry_price || 0);
                                            const isSettled = pos.status === "SETTLED";
                                            const currentPriceCents = isSettled
                                                ? (pos.payout_amount > 0 ? (pos.payout_amount / pos.shares) * 100 : 0)
                                                : (() => {
                                                    const fallback = avgPriceCents;
                                                    if (pos.side === "YES") {
                                                        return orderbook?.yes_bids?.[0]?.price ?? fallback;
                                                    } else {
                                                        return orderbook?.no_asks?.[0]?.price ?? (100 - (orderbook?.yes_bids?.[0]?.price ?? (100 - avgPriceCents)));
                                                    }
                                                })();

                                            const pnl = isSettled
                                                ? pos.realized_pnl
                                                : (currentPriceCents - avgPriceCents) / 100 * pos.shares;

                                            const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

                                            return (
                                                <div key={pos.id || i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all">
                                                    <div className="flex flex-col gap-1.5 shrink-0">
                                                        <div className={cn(
                                                            "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-center",
                                                            pos.side === "YES" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                                                        )}>
                                                            {pos.side}
                                                        </div>
                                                        {isSettled && (
                                                            <div className="px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider text-center bg-white/8 text-gray-500">
                                                                Settled
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-mono text-base font-semibold">
                                                            {pos.shares} shares
                                                        </p>
                                                        {isSettled ? (
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                Avg {avgPriceCents.toFixed(1)}¢ • <span className="text-emerald-400">Paid out ${pos.payout_amount.toFixed(2)}</span>
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                Avg {avgPriceCents.toFixed(1)}¢ • Now {currentPriceCents.toFixed(1)}¢
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="text-right shrink-0">
                                                        <p className={cn(
                                                            "text-base font-mono font-semibold",
                                                            pnl > 0 ? "text-green-400" : pnl < 0 ? "text-red-400" : "text-gray-400"
                                                        )}>
                                                            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                                                        </p>
                                                        <p className={cn(
                                                            "text-xs font-medium",
                                                            pnl > 0 ? "text-green-500" : pnl < 0 ? "text-red-500" : "text-gray-500"
                                                        )}>
                                                            ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
                                                        </p>
                                                    </div>


                                                    <div className="flex flex-col gap-1.5 shrink-0">
                                                        {/* Sell — only when market is active and position not settled */}
                                                        {!isResolved && !isSettled && (
                                                            <button
                                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all"
                                                                onClick={() => handleClosePosition(pos)}
                                                            >
                                                                Sell
                                                            </button>
                                                        )}

                                                        {/* Share — always visible */}
                                                        <button
                                                            className="px-4 py-2 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg transition-all flex items-center justify-center"
                                                            onClick={() => handleSharePosition(pos, pnl, pnlPct, currentPriceCents, avgPriceCents)}
                                                        >
                                                            <ExternalLink size={14} />
                                                        </button>
                                                    </div>


                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Trades Tab */}
                            <TabsContent value="trades" className="flex-1 overflow-y-auto p-4 scrollbar-hide min-h-0">
                                {loadingMarketTrades ? (
                                    <div className="flex h-full items-center justify-center py-12">
                                        <Loader className="w-6 h-6 text-red-600" />
                                    </div>
                                ) : !marketTrades || marketTrades.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                            <Search size={20} className="text-gray-600" />
                                        </div>
                                        <p className="text-gray-400">No trades yet</p>
                                        <p className="text-xs text-gray-600 mt-1">Be the first to trade this market</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-4 px-3 py-1 text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/10">
                                            <span>Time</span>
                                            <span>Side</span>
                                            <span className="text-center">Shares</span>
                                            <span className="text-right">Price</span>
                                        </div>

                                        {/* Trades List */}
                                        {marketTrades.map((trade, i) => (
                                            <div
                                                key={i}
                                                className="grid grid-cols-4 px-3 py-3 hover:bg-white/5 rounded-lg transition-colors text-sm"
                                            >

                                                <span className="text-gray-500 text-xs font-mono">
                                                    {new Date(trade.filled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>

                                                <span className={cn(
                                                    "font-bold",
                                                    trade.side === "YES" ? "text-green-400" : "text-red-400"
                                                )}>
                                                    {trade.side}
                                                </span>

                                                <span className="text-xs text-center text-gray-300 font-mono">{trade.quantity.toFixed(3)}</span>
                                                <span className="text-right text-xs text-gray-400 font-mono">{(trade.price * 100).toFixed(1)}¢</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Orders Tab */}
                            <TabsContent value="open" className="flex-1 overflow-y-auto p-4 scrollbar-hide min-h-0">
                                {loadingOrders ? (  // ← Add this state
                                    <div className="flex h-full items-center justify-center py-12">
                                        <Loader className="w-6 h-6 text-red-600" />
                                    </div>
                                ) : !userOrders || userOrders.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                                            <Search size={28} className="text-gray-600" />
                                        </div>
                                        <p className="text-gray-400 text-lg">No open orders</p>
                                        <p className="text-gray-600 text-sm mt-2 max-w-[260px]">
                                            Your limit orders that haven't been filled will appear here
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 px-4 py-2 text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/10">
                                            <div className="col-span-2">Side</div>
                                            <div className="col-span-2">Type</div>
                                            <div className="col-span-2 text-center">Price</div>
                                            <div className="col-span-2 text-center">Quantity</div>
                                            <div className="col-span-2 text-center">Remaining</div>
                                            <div className="col-span-2 text-right">Action</div>
                                        </div>

                                        {/* Orders List */}
                                        {userOrders.map((order) => {
                                            const isYes = order.side === "YES";
                                            const filledPercent = order.quantity > 0
                                                ? Math.round((order.filled_qty / order.quantity) * 100)
                                                : 0;

                                            return (
                                                <div
                                                    key={order.id}
                                                    className="grid grid-cols-12 px-4 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all items-center"
                                                >
                                                    {/* Side */}
                                                    <div className="col-span-2">
                                                        <div className={cn(
                                                            "inline-flex px-3 py-1 rounded-xl text-xs font-bold uppercase",
                                                            isYes ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                                                        )}>
                                                            {order.side}
                                                        </div>
                                                    </div>

                                                    {/* Type */}
                                                    <div className="col-span-2 text-sm text-gray-400">
                                                        {order.type}
                                                    </div>

                                                    {/* Price */}
                                                    <div className="col-span-2 text-center font-mono text-white">
                                                        {order.type === "MARKET" ? (
                                                            <span className="text-gray-500 text-xs">-</span>
                                                        ) : (
                                                            `${(order.price * 100).toFixed(2)}¢`
                                                        )}
                                                    </div>

                                                    {/* Quantity */}
                                                    <div className="col-span-2 text-center font-mono">
                                                        {order.quantity}
                                                    </div>

                                                    {/* Remaining */}
                                                    <div className="col-span-2 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="font-mono text-white">{order.remaining_qty}</span>
                                                            <span className="text-[10px] text-gray-500">({filledPercent}%)</span>
                                                        </div>
                                                    </div>

                                                    {/* Cancel Button */}
                                                    <div className="col-span-2 text-right">
                                                        <button
                                                            onClick={() => handleCancelOrder(order.id)}
                                                            className="px-4 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* MIDDLE — Orderbook (desktop always visible, mobile only when tab=book) */}
                    <div className={cn(
                        "w-full lg:w-[280px] xl:w-[320px] flex flex-col border border-white/8 rounded-xl shrink-0 bg-[#0a0a0a] overflow-hidden",
                        mobileTab === "book" ? "flex" : "hidden lg:flex"
                    )}>
                        {orderbookPanel}
                    </div>

                    {/* RIGHT — Order form (desktop always visible, mobile only when tab=order) */}
                    <div className={cn(
                        "w-full lg:w-[320px] xl:w-[360px] flex flex-col rounded-xl shrink-0 bg-[#0a0a0a] border border-white/8 overflow-hidden",
                        mobileTab === "order" ? "flex" : "hidden lg:flex"
                    )}>
                        {orderForm}
                    </div>
                </div>
            </div>

            <QuickTradeModal
                isOpen={isQuickTradeOpen}
                onClose={() => setIsQuickTradeOpen(false)}
                market={market}
                selectedSide={selectedSide}
            />

            {/* Cancel Order Warning Modal */}
            {showCancelModal && orderToCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-[340px] mx-4">
                        <div className="text-center">
                            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                <span className="text-2xl">⚠️</span>
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-2">Cancel Order?</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                This action cannot be undone. The order will be removed from the orderbook.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 py-3 text-sm font-semibold rounded-2xl border border-white/10 hover:bg-white/5 transition-colors"
                                >
                                    Keep Order
                                </button>

                                <button
                                    onClick={async () => {
                                        try {
                                            await cancelOrder(token!, orderToCancel);
                                            toast.success("Order cancelled successfully");
                                            setShowCancelModal(false);
                                            setOrderToCancel(null);

                                        } catch (err) {
                                            toast.error("Failed to cancel order");
                                        }
                                    }}
                                    className="flex-1 py-3 text-sm font-semibold rounded-2xl bg-red-600 hover:bg-red-700 transition-colors"
                                >
                                    Yes, Cancel Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Close Position Warning Modal */}
            {showClosePositionModal && positionToClose && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-[360px] mx-4">
                        <div className="text-center">
                            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                                <span className="text-3xl">📉</span>
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-1">Close Position?</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Sell all <span className="font-mono">{positionToClose.shares}</span> {positionToClose.side} shares at current market price?
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowClosePositionModal(false)}
                                    className="flex-1 py-3 text-sm font-semibold rounded-2xl border border-white/10 hover:bg-white/5 transition-colors"
                                >
                                    Keep Position
                                </button>

                                <button
                                    onClick={async () => {
                                        if (!token || !positionToClose) return;

                                        const data = {
                                            position_id: positionToClose.id,
                                            shares: positionToClose.shares,
                                        }

                                        try {
                                            await closePosition(market.id, token, positionToClose.id, data);
                                            toast.success("Position closed successfully");
                                            setShowClosePositionModal(false);
                                            setPositionToClose(null);
                                        } catch (err) {
                                            toast.error("Failed to close position");
                                        }
                                    }}
                                    className="flex-1 py-3 text-sm font-semibold rounded-2xl bg-white text-black hover:bg-gray-200 transition-colors"
                                >
                                    Yes, Close Position
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {sharePosition && market && (
                <SharePositionModal
                    isOpen={true}
                    onClose={() => setSharePosition(null)}
                    position={sharePosition.pos}
                    market={market}
                    pnl={sharePosition.pnl}
                    pnlPct={sharePosition.pnlPct}
                    avgPriceCents={sharePosition.avgPriceCents}
                    currentPriceCents={sharePosition.currentPriceCents}
                />
            )}
        </>
    );
}
