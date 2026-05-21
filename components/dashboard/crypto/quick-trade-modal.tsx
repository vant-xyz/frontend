"use client";

import { useEffect, useState, useCallback } from "react";
import { Market, placeOrder, closePosition, OrderSide, getOrderbook, getBalance, BalanceInfo, getTokenPrices, getMarketHistory, MarketHistoryEntry, getUserPositions, Position } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, BarChart3, DollarSign, TrendingUp, TrendingDown, MoreHorizontal, CircleHelp, X, ExternalLink, LayoutDashboard, BookOpen, CandlestickChart, ListOrdered, LineChart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Loader } from "@/components/ui/loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDashboard } from "@/hooks/use-dashboard";
import { useRouter } from "next/navigation";

interface QuickTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    market: Market;
    selectedSide: OrderSide;
}

export function QuickTradeModal({ isOpen, onClose, market, selectedSide: initialSide }: QuickTradeModalProps) {
    const { isDemoMode } = useDashboard();
    const router = useRouter();
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const [showProHelp, setShowProHelp] = useState(false);

    const [orderMode, setOrderMode] = useState<"BUY" | "SELL">("BUY");
    const [selectedSide, setSelectedSide] = useState<OrderSide>(initialSide);
    const [inputMode, setInputMode] = useState<"shares" | "usd">("usd");
    const [quantity, setQuantity] = useState("0");
    const [usdAmount, setUsdAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [quoteCents, setQuoteCents] = useState<{ yes: number; no: number }>({ yes: 50, no: 50 });
    const [balance, setBalance] = useState<BalanceInfo | null>(null);
    const [tokenUsdMap, setTokenUsdMap] = useState<Record<string, number>>({});
    const [marketHistory, setMarketHistory] = useState<MarketHistoryEntry[]>([]);
    const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
    const [positions, setPositions] = useState<Position[] | null>(null);

    // Help overlays
    const [showQuotePriceHelp, setShowQuotePriceHelp] = useState(false);
    const [showYouReceiveHelp, setShowYouReceiveHelp] = useState(false);
    const [showTotalCostHelp, setShowTotalCostHelp] = useState(false);
    const [showIfWinsHelp, setShowIfWinsHelp] = useState(false);

    const toCents = (v?: number) => {
        const n = Number(v ?? 0);
        if (!Number.isFinite(n)) return 0;
        return n <= 1 ? n * 100 : n;
    };

    useEffect(() => {
        if (!isOpen) return;
        setSelectedSide(initialSide);
        setOrderMode("BUY");
        setQuantity("0");
        setUsdAmount("");
    }, [isOpen, initialSide]);

    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        const load = async () => {
            try {
                const ob = await getOrderbook(market.id);
                const yes = toCents(ob.orderbook?.yes_bids?.[0]?.price) || toCents(ob.orderbook?.last_traded_price) || 50;
                const no = toCents(ob.orderbook?.no_asks?.[0]?.price) || Math.max(0, 100 - yes);
                if (active) setQuoteCents({ yes, no });
            } catch {
                if (active) setQuoteCents({ yes: 50, no: 50 });
            }
        };
        load();
        const i = setInterval(load, 1000);
        return () => { active = false; clearInterval(i); };
    }, [market.id, isOpen]);

    useEffect(() => {
        if (!isOpen || !token) return;
        let active = true;
        const load = async () => {
            try {
                const res = await getBalance(token);
                if (active) setBalance(res.balance);
            } catch { }
        };
        load();
        return () => { active = false; };
    }, [token, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        const load = async () => {
            try {
                const res = await getTokenPrices(["SOL", "USDC", "USDT", "USDG", "ETH"]);
                if (active) setTokenUsdMap(res.prices || {});
            } catch { }
        };
        load();
        return () => { active = false; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || market.market_type !== "CAPPM") return;
        let active = true;
        const load = async () => {
            try {
                const res = await getMarketHistory(market.id);
                if (active) setMarketHistory(res.history ?? []);
            } catch { }
        };
        load();
        return () => { active = false; };
    }, [isOpen, market.id, market.market_type]);

    const fetchPositions = useCallback(async () => {
        if (!token) return;
        try {
            const res = await getUserPositions(token, market.id);
            setPositions(res.positions.filter(p => p.status === "ACTIVE"));
        } catch {
            setPositions([]);
        }
    }, [token, market.id]);

    useEffect(() => {
        if (!isOpen || !token) return;
        fetchPositions();
        const i = setInterval(fetchPositions, 5000);
        return () => clearInterval(i);
    }, [isOpen, fetchPositions, token]);

    // Auto-select side when entering sell mode
    useEffect(() => {
        if (orderMode !== "SELL" || positions === null) return;
        const yesShares = positions.filter(p => p.side === "YES").reduce((s, p) => s + p.shares, 0);
        const noShares = positions.filter(p => p.side === "NO").reduce((s, p) => s + p.shares, 0);
        if (yesShares > 0 && noShares === 0) setSelectedSide("YES");
        else if (noShares > 0 && yesShares === 0) setSelectedSide("NO");
        setQuantity("0");
        setUsdAmount("");
    }, [orderMode]);

    const tradingBalance = isDemoMode ? (balance?.demo_naira ?? 0) : (balance?.naira ?? 0);
    const assetBalance = (() => {
        if (!balance) return 0;
        if (isDemoMode) {
            const solPx = tokenUsdMap.SOL ?? 0;
            const usdcPx = tokenUsdMap.USDC ?? 1;
            return (balance.demo_sol ?? 0) * solPx + (balance.demo_usdc_sol ?? 0) * usdcPx;
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
            (balance.vusd ?? 0);
    })();

    const ownedYesShares = (positions || []).filter(p => p.side === "YES").reduce((s, p) => s + p.shares, 0);
    const ownedNoShares = (positions || []).filter(p => p.side === "NO").reduce((s, p) => s + p.shares, 0);
    const ownedSideShares = selectedSide === "YES" ? ownedYesShares : ownedNoShares;

    const marketPriceCents = selectedSide === "YES" ? quoteCents.yes : quoteCents.no;
    const pricePerShareDollars = marketPriceCents / 100;

    const effectiveQuantity = orderMode === "SELL"
        ? (parseFloat(quantity) || 0)
        : inputMode === "shares"
            ? (parseFloat(quantity) || 0)
            : (parseFloat(usdAmount) || 0) / (pricePerShareDollars > 0 ? pricePerShareDollars : 1);
    const sharesTotal = effectiveQuantity * pricePerShareDollars;
    const youReceive = orderMode === "SELL" ? sharesTotal : effectiveQuantity * 1.00;

    const applyPreset = (label: string) => {
        if (orderMode === "SELL") {
            const pct = label === "25%" ? 0.25 : label === "50%" ? 0.5 : 1;
            setQuantity((ownedSideShares * pct).toFixed(2));
            return;
        }
        if (pricePerShareDollars <= 0) return;
        if (inputMode === "usd") {
            let amt = 0;
            if (label === "25%") amt = tradingBalance * 0.25;
            else if (label === "50%") amt = tradingBalance * 0.5;
            else amt = tradingBalance;
            setUsdAmount(amt.toFixed(2));
        } else {
            const maxAffordable = Math.floor(tradingBalance / pricePerShareDollars);
            let q = 0;
            if (label === "25%") q = Math.max(0, Math.floor(maxAffordable * 0.25));
            else if (label === "50%") q = Math.max(0, Math.floor(maxAffordable * 0.5));
            else q = Math.max(0, maxAffordable);
            setQuantity(String(q));
        }
    };

    const sliderPct = (() => {
        if (orderMode === "SELL") {
            return ownedSideShares > 0 ? Math.min(100, Math.round((parseFloat(quantity) || 0) / ownedSideShares * 100)) : 0;
        }
        if (inputMode === "usd") {
            return tradingBalance > 0 ? Math.min(100, Math.round((parseFloat(usdAmount) || 0) / tradingBalance * 100)) : 0;
        }
        const maxAffordable = pricePerShareDollars > 0 ? tradingBalance / pricePerShareDollars : 0;
        return maxAffordable > 0 ? Math.min(100, Math.round((parseFloat(quantity) || 0) / maxAffordable * 100)) : 0;
    })();

    const handleSliderChange = (val: number[]) => {
        const pct = val[0];
        if (orderMode === "SELL") {
            setQuantity(((pct / 100) * ownedSideShares).toFixed(2));
        } else {
            const amount = (pct / 100) * tradingBalance;
            if (inputMode === "usd") {
                setUsdAmount(amount.toFixed(2));
            } else {
                if (pricePerShareDollars > 0) setQuantity(String(Math.floor(amount / pricePerShareDollars)));
            }
        }
    };

    const handlePlaceOrder = async () => {
        if (!token) { toast.error("Please login to trade"); return; }
        if (effectiveQuantity <= 0) { toast.error("Enter a valid quantity"); return; }
        try {
            setSubmitting(true);
            if (orderMode === "SELL") {
                const activePosition = (positions || []).find(p => p.side === selectedSide && p.status === "ACTIVE");
                if (!activePosition) { toast.error("No active position to sell"); return; }
                if (effectiveQuantity > activePosition.shares) {
                    toast.error(`You only own ${activePosition.shares.toFixed(2)} ${selectedSide} shares`);
                    return;
                }
                await closePosition(market.id, token, activePosition.id, { position_id: activePosition.id, shares: effectiveQuantity });
                toast.success("Position sold!");
            } else {
                await placeOrder(token, {
                    market_id: market.id,
                    side: selectedSide,
                    type: "MARKET",
                    quantity: effectiveQuantity,
                    is_demo: isDemoMode,
                });
                toast.success("Order placed!");
            }
            setQuantity("0");
            setUsdAmount("");
            fetchPositions();
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to place order");
        } finally {
            setSubmitting(false);
        }
    };

    const historyBar = market.market_type === "CAPPM" && marketHistory.length > 0 ? (
        <div className="relative flex items-center gap-1">
            {marketHistory.slice(0, 5).map((h) => {
                const isYes = h.outcome === "YES";
                const t = new Date(h.end_time_utc);
                const timeStr = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
                return (
                    <div key={h.id} className="flex flex-col items-center gap-0.5 shrink-0">
                        {isYes ? <TrendingUp size={13} className="text-green-400" /> : <TrendingDown size={13} className="text-red-400" />}
                        <span className="text-[8px] font-mono text-gray-500">{timeStr}</span>
                    </div>
                );
            })}
            {marketHistory.length > 5 && (
                <div className="relative">
                    <button onClick={() => setShowHistoryDropdown(v => !v)}
                        className="flex flex-col items-center gap-0.5 px-1 py-0.5 rounded hover:bg-white/8 transition-colors">
                        <MoreHorizontal size={13} className="text-gray-500" />
                        <span className="text-[8px] font-mono text-gray-500">+{marketHistory.length - 5}</span>
                    </button>
                    {showHistoryDropdown && (
                        <div className="absolute right-0 top-full mt-1 w-28 max-h-48 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 py-1">
                            {marketHistory.slice(5).map((h) => {
                                const isYes = h.outcome === "YES";
                                const t = new Date(h.end_time_utc);
                                const timeStr = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
                                return (
                                    <div key={h.id} className="flex items-center justify-between px-3 py-1.5">
                                        {isYes ? <TrendingUp size={11} className="text-green-400" /> : <TrendingDown size={11} className="text-red-400" />}
                                        <span className="text-[10px] font-mono text-gray-400">{timeStr}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    ) : null;

    const proViewRow = (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            <div className="flex items-center gap-2 min-w-0">
                {historyBar ? (
                    <>
                        <span className="text-[9px] text-gray-600 uppercase tracking-widest shrink-0">Past</span>
                        {historyBar}
                    </>
                ) : (
                    <span className="text-[9px] text-gray-600 uppercase tracking-widest">Quick Trade</span>
                )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-3">
                <button
                    onClick={() => setShowProHelp(true)}
                    className="text-gray-600 hover:text-gray-400 transition-colors"
                    title="What is Pro View?"
                >
                    <CircleHelp size={13} />
                </button>
                <button
                    onClick={() => { onClose(); router.push(`/market/${market.id}`); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/8 hover:bg-white/15 text-gray-300 hover:text-white transition-colors text-[10px] font-semibold border border-white/10"
                >
                    <ExternalLink size={11} />
                    Pro View
                </button>
            </div>
        </div>
    );

    const body = (
        <div className="relative flex flex-col gap-0 h-full overflow-y-auto">
            {/* Pro View help overlay */}
            {showProHelp && (
                <div className="absolute inset-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm flex flex-col p-5 overflow-y-auto">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">About</p>
                            <h3 className="text-base font-black text-white">Pro View Mode</h3>
                        </div>
                        <button
                            onClick={() => setShowProHelp(false)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="space-y-4 text-sm">
                        <p className="text-gray-300 leading-relaxed">
                            Pro View is the full market terminal for this market — everything you need to trade with precision and context, on one page.
                        </p>

                        <div className="space-y-3">
                            {[
                                { icon: CandlestickChart, label: "Live Charts", desc: "Candlestick spot price chart and opinion trend chart showing market sentiment over time." },
                                { icon: BookOpen, label: "Live Orderbook", desc: "Real-time depth of YES and NO orders. See exactly where liquidity sits and how prices move." },
                                { icon: ListOrdered, label: "Limit Orders", desc: "Place limit orders at a specific price instead of hitting the market. Not available in Quick Trade." },
                                { icon: LineChart, label: "Market Stats", desc: "Open interest, volatility, volume, and trade history for the full picture." },
                                { icon: LayoutDashboard, label: "Positions & Orders", desc: "View your open orders and active positions for this market alongside your trade form." },
                            ].map(({ icon: Icon, label, desc }) => (
                                <div key={label} className="flex gap-3">
                                    <div className="shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mt-0.5">
                                        <Icon size={13} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-xs">{label}</p>
                                        <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-3 border-t border-white/10">
                            <p className="text-[10px] text-gray-600 leading-relaxed">
                                <span className="text-gray-400 font-semibold">Quick Trade</span> is best for fast market buys when you already know your conviction. Use <span className="text-gray-400 font-semibold">Pro View</span> when you want context, precision, or limit order control.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => { setShowProHelp(false); onClose(); router.push(`/market/${market.id}`); }}
                        className="mt-5 w-full py-2.5 rounded-xl bg-white text-black text-xs font-black tracking-wide hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <ExternalLink size={13} />
                        Open Pro View
                    </button>
                </div>
            )}

            {/* Quote price / Sell price help overlay */}
            {showQuotePriceHelp && (
                <div className="absolute inset-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm flex flex-col p-5">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-base font-black text-white">{orderMode === "SELL" ? "Sell Price" : "Quote Price"}</h3>
                        <button onClick={() => setShowQuotePriceHelp(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                            <X size={15} />
                        </button>
                    </div>
                    <div className="space-y-3 text-sm text-gray-300">
                        <p>The current market price per {selectedSide} share. This is the price your {orderMode === "SELL" ? "sell" : "buy"} will be secured at when the order executes.</p>
                        <p className="text-xs text-gray-500">Updates every second from the live orderbook. Shown in cents (¢) — divide by 100 to get the dollar price per share.</p>
                    </div>
                    <button onClick={() => setShowQuotePriceHelp(false)} className="mt-6 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors">Got it</button>
                </div>
            )}

            {/* You'll receive / get back help overlay */}
            {showYouReceiveHelp && (
                <div className="absolute inset-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm flex flex-col p-5">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-base font-black text-white">{orderMode === "SELL" ? "You'll Get Back" : "You'll Receive"}</h3>
                        <button onClick={() => setShowYouReceiveHelp(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                            <X size={15} />
                        </button>
                    </div>
                    <div className="space-y-3 text-sm text-gray-300">
                        {orderMode === "SELL" ? (
                            <>
                                <p>The dollar value you get back for selling this amount of shares.</p>
                                <p>Calculated as: <span className="text-white font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">shares × sell price per share</span></p>
                                <p className="text-xs text-gray-500">This goes straight back to your trading balance.</p>
                            </>
                        ) : (
                            <>
                                <p>The maximum payout if your chosen side wins at settlement.</p>
                                <p>Each share pays exactly <span className="text-white font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">$1.00</span> if your side resolves correct, so this equals the number of shares you buy.</p>
                                <p className="text-xs text-gray-500">If your side loses, shares expire worthless.</p>
                            </>
                        )}
                    </div>
                    <button onClick={() => setShowYouReceiveHelp(false)} className="mt-6 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors">Got it</button>
                </div>
            )}

            {/* Total cost help overlay */}
            {showTotalCostHelp && (
                <div className="absolute inset-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm flex flex-col p-5">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-base font-black text-white">Total Cost</h3>
                        <button onClick={() => setShowTotalCostHelp(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                            <X size={15} />
                        </button>
                    </div>
                    <div className="space-y-3 text-sm text-gray-300">
                        <p>The total USD amount that will be deducted from your trading balance for this order.</p>
                        <p>Calculated as: <span className="text-white font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">shares × price per share</span></p>
                        <p className="text-xs text-gray-500">This is the capital at risk. You receive shares in return, which pay $1.00 each if your side wins at settlement.</p>
                    </div>
                    <button onClick={() => setShowTotalCostHelp(false)} className="mt-6 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors">Got it</button>
                </div>
            )}

            {/* If wins help overlay */}
            {showIfWinsHelp && (
                <div className="absolute inset-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm flex flex-col p-5">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-base font-black text-white">If {selectedSide} Wins</h3>
                        <button onClick={() => setShowIfWinsHelp(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                            <X size={15} />
                        </button>
                    </div>
                    <div className="space-y-3 text-sm text-gray-300">
                        <p>The potential return percentage if this market resolves in your favour.</p>
                        <p>Calculated as: <span className="text-white font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">(payout − cost) / cost × 100%</span></p>
                        <p className="text-xs text-gray-500">This does not include the case where your side loses. Treat this market like any other binary outcome — do your research.</p>
                    </div>
                    <button onClick={() => setShowIfWinsHelp(false)} className="mt-6 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors">Got it</button>
                </div>
            )}

            {proViewRow}

            {/* BUY / SELL tabs */}
            <div className="flex border-b border-white/8">
                {(["BUY", "SELL"] as const).map(m => (
                    <button key={m} onClick={() => setOrderMode(m)}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold tracking-wide transition-colors -mb-px border-b-2",
                            m === orderMode
                                ? m === "BUY" ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
                                : "border-transparent text-gray-500 hover:text-gray-300"
                        )}>
                        {m}
                    </button>
                ))}
            </div>

            {/* YES / NO tabs */}
            <div className="flex border-b border-white/8 px-4">
                {(["YES", "NO"] as const).map(side => {
                    const ownedCount = side === "YES" ? ownedYesShares : ownedNoShares;
                    const isDisabled = orderMode === "SELL" && ownedCount === 0;
                    const priceCents = side === "YES" ? quoteCents.yes : quoteCents.no;
                    return (
                        <button
                            key={side}
                            onClick={() => !isDisabled && setSelectedSide(side)}
                            disabled={isDisabled}
                            className={cn(
                                "flex-1 py-2.5 text-sm font-bold transition-colors -mb-px border-b-2 flex items-center justify-center gap-1",
                                selectedSide === side && orderMode !== "SELL"
                                    ? side === "YES" ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
                                    : selectedSide === side && orderMode === "SELL"
                                        ? side === "YES" ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
                                        : "border-transparent text-gray-400 hover:text-white",
                                isDisabled && "opacity-30 cursor-not-allowed hover:text-gray-400"
                            )}
                        >
                            {side} {priceCents.toFixed(1)}¢
                            {orderMode === "SELL" && ownedCount > 0 && (
                                <span className="ml-1 text-[10px] font-normal text-gray-500">({ownedCount.toFixed(2)} sh)</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="p-4 space-y-3">
                {/* Order size */}
                <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <BarChart3 size={12} />
                            {orderMode === "SELL"
                                ? <>{ownedSideShares.toFixed(2)} {selectedSide} shares owned</>
                                : "Order Size"
                            }
                        </span>
                        {orderMode !== "SELL" && (
                            <span className="text-[10px] text-gray-400">
                                Balance ${tradingBalance.toFixed(2)} · Assets ${assetBalance.toFixed(2)}
                            </span>
                        )}
                    </div>

                    {/* Shares / USD toggle — hidden in sell mode */}
                    {orderMode !== "SELL" && (
                        <div className="grid grid-cols-2 gap-1 mb-3">
                            <button onClick={() => setInputMode("shares")}
                                className={cn("py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1",
                                    inputMode === "shares" ? "bg-white/15 text-white" : "bg-white/5 text-gray-400 hover:text-gray-200"
                                )}>
                                <BarChart3 size={12} /> Shares
                            </button>
                            <button onClick={() => setInputMode("usd")}
                                className={cn("py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1",
                                    inputMode === "usd" ? "bg-white/15 text-white" : "bg-white/5 text-gray-400 hover:text-gray-200"
                                )}>
                                <DollarSign size={12} /> USD
                            </button>
                        </div>
                    )}

                    {/* Input */}
                    <div className="mb-3 flex items-stretch gap-1">
                        <Input
                            type="number"
                            value={orderMode === "SELL" || inputMode === "shares" ? quantity : usdAmount}
                            onChange={e => {
                                if (orderMode === "SELL" || inputMode === "shares") setQuantity(e.target.value);
                                else setUsdAmount(e.target.value);
                            }}
                            className="flex-1 bg-white/5 border-white/10 text-white h-11 font-mono"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                        />
                        <div className="flex flex-col gap-0.5">
                            <button type="button"
                                onClick={() => {
                                    if (orderMode === "SELL" || inputMode === "shares") setQuantity(String(Math.max(0, (parseFloat(quantity) || 0) + 1)));
                                    else setUsdAmount((Math.max(0, (parseFloat(usdAmount) || 0) + 1)).toFixed(2));
                                }}
                                className="flex-1 w-8 rounded-md bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex items-center justify-center">
                                <ChevronUp size={12} />
                            </button>
                            <button type="button"
                                onClick={() => {
                                    if (orderMode === "SELL" || inputMode === "shares") setQuantity(String(Math.max(0, (parseFloat(quantity) || 0) - 1)));
                                    else setUsdAmount((Math.max(0, (parseFloat(usdAmount) || 0) - 1)).toFixed(2));
                                }}
                                className="flex-1 w-8 rounded-md bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex items-center justify-center">
                                <ChevronDown size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Slider */}
                    {(orderMode === "SELL" ? ownedSideShares > 0 : tradingBalance > 0) && (
                        <div className="mb-3 pt-1">
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[sliderPct]}
                                onValueChange={handleSliderChange}
                                className="[&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-track]]:bg-white/10"
                            />
                        </div>
                    )}

                    {/* Presets */}
                    <div className="flex gap-1.5">
                        {["25%", "50%", "MAX"].map(label => (
                            <button key={label} onClick={() => applyPreset(label)}
                                className="flex-1 py-1.5 text-[10px] font-semibold border border-white/10 rounded-lg text-gray-400 hover:border-white/25 hover:text-gray-200 transition-colors">
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white/5 rounded-xl p-3 space-y-2">
                    {/* Quote / Sell price */}
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 flex items-center gap-1">
                            {orderMode === "SELL" ? "Sell price" : "Quote price"}
                            <button onClick={() => setShowQuotePriceHelp(true)} className="text-gray-600 hover:text-gray-400 transition-colors">
                                <CircleHelp size={11} />
                            </button>
                        </span>
                        <span className="text-gray-300 font-mono">{marketPriceCents.toFixed(1)}¢ / share</span>
                    </div>

                    {/* Total Cost — hidden in sell mode */}
                    {orderMode !== "SELL" && (
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500 flex items-center gap-1">
                                Total Cost
                                <button onClick={() => setShowTotalCostHelp(true)} className="text-gray-600 hover:text-gray-400 transition-colors">
                                    <CircleHelp size={11} />
                                </button>
                            </span>
                            <span className="text-white font-mono">${sharesTotal.toFixed(2)}</span>
                        </div>
                    )}

                    {/* You'll receive / get back */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                            {orderMode === "SELL" ? "You'll get back" : "You'll receive"}
                            <button onClick={() => setShowYouReceiveHelp(true)} className="text-gray-600 hover:text-gray-400 transition-colors">
                                <CircleHelp size={11} />
                            </button>
                        </span>
                        <span className="text-teal-400 text-lg font-mono font-semibold">${youReceive.toFixed(2)}</span>
                    </div>

                    {/* If X wins — hidden in sell mode */}
                    {orderMode !== "SELL" && effectiveQuantity > 0 && sharesTotal > 0 && (
                        <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                                If {selectedSide} wins
                                <button onClick={() => setShowIfWinsHelp(true)} className="text-gray-600 hover:text-gray-400 transition-colors normal-case tracking-normal">
                                    <CircleHelp size={11} />
                                </button>
                            </span>
                            <span className="text-gray-300 text-xs font-mono font-bold">
                                +{(((youReceive - sharesTotal) / sharesTotal) * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>

                {/* CTA */}
                {(market.status !== "active" || new Date(market.end_time_utc) <= new Date()) ? (
                    <div className="w-full py-3 rounded-md text-xs font-bold tracking-wide text-center bg-white/5 text-gray-500 cursor-not-allowed border border-white/10">
                        Market expired · Orders closed
                    </div>
                ) : (
                    <button onClick={handlePlaceOrder} disabled={submitting || effectiveQuantity <= 0}
                        className={cn(
                            "w-full py-3 rounded-md text-xs font-bold tracking-wide transition-all",
                            "disabled:opacity-40 disabled:cursor-not-allowed",
                            orderMode === "SELL"
                                ? "bg-white text-black hover:bg-gray-100"
                                : selectedSide === "YES"
                                    ? "bg-green-500 text-white hover:bg-green-400"
                                    : "bg-red-600 text-white hover:bg-red-500"
                        )}>
                        {submitting
                            ? <Loader className="mx-auto" />
                            : `${orderMode === "SELL" ? "Sell" : "Buy"} ${selectedSide[0] + selectedSide.slice(1).toLowerCase()} · ${effectiveQuantity.toFixed(3)} shares`}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-sm p-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-0">
                    <DialogTitle className="text-sm font-semibold text-white truncate">{market.title}</DialogTitle>
                </DialogHeader>
                {body}
            </DialogContent>
        </Dialog>
    );
}
