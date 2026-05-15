"use client";

import { useEffect, useState } from "react";
import { Market, placeOrder, OrderSide, getOrderbook, getBalance, BalanceInfo, getTokenPrices, getMarketHistory, MarketHistoryEntry } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, BarChart3, DollarSign, TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDashboard } from "@/hooks/use-dashboard";

interface QuickTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    market: Market;
    selectedSide: OrderSide;
}

export function QuickTradeModal({ isOpen, onClose, market, selectedSide: initialSide }: QuickTradeModalProps) {
    const { isDemoMode } = useDashboard();
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

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

    const toCents = (v?: number) => {
        const n = Number(v ?? 0);
        if (!Number.isFinite(n)) return 0;
        return n <= 1 ? n * 100 : n;
    };

    useEffect(() => {
        if (!isOpen) return;
        setSelectedSide(initialSide);
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

    const marketPriceCents = selectedSide === "YES" ? quoteCents.yes : quoteCents.no;
    const pricePerShareDollars = marketPriceCents / 100;
    const effectiveQuantity = inputMode === "shares"
        ? (parseFloat(quantity) || 0)
        : (parseFloat(usdAmount) || 0) / (pricePerShareDollars > 0 ? pricePerShareDollars : 1);
    const sharesTotal = effectiveQuantity * pricePerShareDollars;
    const youReceive = effectiveQuantity * 1.00;

    const applyPreset = (label: string) => {
        if (pricePerShareDollars <= 0) return;
        const maxAffordable = Math.floor(tradingBalance / pricePerShareDollars);
        let q = 0;
        if (label === "25%") q = Math.max(0, Math.floor(maxAffordable * 0.25));
        else if (label === "50%") q = Math.max(0, Math.floor(maxAffordable * 0.5));
        else q = Math.max(0, maxAffordable);
        if (inputMode === "shares") setQuantity(String(q));
        else setUsdAmount((q * pricePerShareDollars).toFixed(2));
    };

    const handlePlaceOrder = async () => {
        if (!token) { toast.error("Please login to trade"); return; }
        if (effectiveQuantity <= 0) { toast.error("Enter a valid quantity"); return; }
        try {
            setSubmitting(true);
            await placeOrder(token, {
                market_id: market.id,
                side: selectedSide,
                type: "MARKET",
                quantity: effectiveQuantity,
                is_demo: isDemoMode,
            });
            toast.success("Order placed!");
            setQuantity("0");
            setUsdAmount("");
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

    const body = (
        <div className="flex flex-col gap-0 h-full overflow-y-auto">
            {/* Past results — CAPPM only */}
            {historyBar && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                    <span className="text-[9px] text-gray-600 uppercase tracking-widest shrink-0">Past</span>
                    {historyBar}
                </div>
            )}
            {/* YES / NO */}
            <div className="p-4 border-b border-white/8">
                <div className="grid grid-cols-2 rounded-xl overflow-hidden bg-white/5 p-1 gap-1">
                    <button onClick={() => setSelectedSide("YES")}
                        className={cn("py-2.5 rounded-lg text-sm font-bold transition-all",
                            selectedSide === "YES" ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-gray-400 hover:text-white"
                        )}>
                        Yes {quoteCents.yes.toFixed(1)}¢
                    </button>
                    <button onClick={() => setSelectedSide("NO")}
                        className={cn("py-2.5 rounded-lg text-sm font-bold transition-all",
                            selectedSide === "NO" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-gray-400 hover:text-white"
                        )}>
                        No {quoteCents.no.toFixed(1)}¢
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {/* Order size */}
                <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <BarChart3 size={12} /> Order Size
                        </span>
                        <span className="text-[10px] text-gray-400">
                            Balance ${tradingBalance.toFixed(2)} · Assets ${assetBalance.toFixed(2)}
                        </span>
                    </div>

                    {/* Shares / USD toggle */}
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

                    {/* Input */}
                    <div className="mb-3 flex items-stretch gap-1">
                        <Input
                            type="number"
                            value={inputMode === "shares" ? quantity : usdAmount}
                            onChange={e => inputMode === "shares" ? setQuantity(e.target.value) : setUsdAmount(e.target.value)}
                            className="flex-1 bg-white/5 border-white/10 text-white h-11 font-mono"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                        />
                        <div className="flex flex-col gap-0.5">
                            <button type="button"
                                onClick={() => {
                                    if (inputMode === "shares") setQuantity(String(Math.max(0, (parseFloat(quantity) || 0) + 1)));
                                    else setUsdAmount((Math.max(0, (parseFloat(usdAmount) || 0) + 1)).toFixed(2));
                                }}
                                className="flex-1 w-8 rounded-md bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex items-center justify-center">
                                <ChevronUp size={12} />
                            </button>
                            <button type="button"
                                onClick={() => {
                                    if (inputMode === "shares") setQuantity(String(Math.max(0, (parseFloat(quantity) || 0) - 1)));
                                    else setUsdAmount((Math.max(0, (parseFloat(usdAmount) || 0) - 1)).toFixed(2));
                                }}
                                className="flex-1 w-8 rounded-md bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex items-center justify-center">
                                <ChevronDown size={12} />
                            </button>
                        </div>
                    </div>

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
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Quote price</span>
                        <span className="text-gray-300 font-mono">{marketPriceCents.toFixed(1)}¢ / share</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Total Cost</span>
                        <span className="text-white font-mono">${sharesTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">You'll receive</span>
                        <span className="text-teal-400 text-lg font-mono font-semibold">${youReceive.toFixed(2)}</span>
                    </div>
                    {effectiveQuantity > 0 && sharesTotal > 0 && (
                        <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">If {selectedSide} wins</span>
                            <span className="text-gray-300 text-xs font-mono font-bold">
                                +{(((youReceive - sharesTotal) / sharesTotal) * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <button onClick={handlePlaceOrder} disabled={submitting || effectiveQuantity <= 0}
                    className={cn(
                        "w-full py-3 rounded-xl text-xs font-bold tracking-wide transition-all",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        selectedSide === "YES"
                            ? "bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/20"
                            : "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20"
                    )}>
                    {submitting
                        ? <Loader className="mx-auto" />
                        : `Buy ${selectedSide[0] + selectedSide.slice(1).toLowerCase()} · ${effectiveQuantity.toFixed(3)} shares`}
                </button>
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
