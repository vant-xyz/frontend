"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Market, getOrderbook, OrderbookSnapshot, placeOrder, OrderSide, OrderType, getUserProfile, UserProfile } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, TrendingUp, TrendingDown, Activity, Target, LineChart, BarChart2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { QuickTradeModal } from "./quick-trade-modal";
import { Loader } from "@/components/ui/loader";

import { CandlestickChart } from "@/components/ui/CandlestickChart";
import { OpinionTrendChart } from "@/components/ui/OpinionTrendChart";

interface MarketDetailViewProps {
  market: Market;
  onBack: () => void;
}


export function MarketDetailView({ market, onBack }: MarketDetailViewProps) {
  const [orderbook, setOrderbook] = useState<OrderbookSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [selectedSide, setSelectedSide] = useState<OrderSide>("YES");
  const [price, setPrice] = useState<string>("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const [usdAmount, setUsdAmount] = useState<string>("");
  const [inputMode, setInputMode] = useState<"shares" | "usd">("shares");
  const [submitting, setSubmitting] = useState(false);
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ seconds: number; text: string }>({ seconds: 0, text: "" });
  const token = localStorage.getItem("auth_token")
  const [chartType, setChartType] = useState<'candlestick' | 'opinion'>('candlestick');

  const toCents = (v?: number) => {
    const n = Number(v ?? 0);
    if (!Number.isFinite(n)) return 0;
    return n <= 1 ? n * 100 : n;
  };
  const fromCentsToDollars = (cents: number) => cents / 100;
  const yesCents = toCents(orderbook?.yes_bids?.[0]?.price) || toCents(orderbook?.last_traded_price) || 50;
  const noCents = toCents(orderbook?.no_asks?.[0]?.price) || Math.max(0, 100 - yesCents);
  const selectedSideDollars = fromCentsToDollars(selectedSide === "YES" ? yesCents : noCents);



  useEffect(() => {
    const getProfile = async () => {
      if (token) {
        try {
          const userData = await getUserProfile(token);
          setUserProfile(userData.user);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
        }
      }
    };
    getProfile();
  }, [token])

  const loadOrderbook = useCallback(async () => {
    try {
      const res = await getOrderbook(market.id);
      setOrderbook(res.orderbook);
    } catch (err) {
      console.error("Failed to load orderbook:", err);
    } finally {
      setLoading(false);
    }
  }, [market.id]);

  useEffect(() => {
    loadOrderbook();
    const interval = setInterval(loadOrderbook, 1000);
    return () => clearInterval(interval);
  }, [market.id, loadOrderbook]);

  useEffect(() => {
    const updateTimeLeft = () => {
      const endTime = new Date(market.end_time_utc).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft({ seconds: 0, text: "00:00" });
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft({
          seconds: diff / 1000,
          text: `${minutes}:${seconds.toString().padStart(2, '0')}`
        });
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [market.end_time_utc]);

  const currentPrice = market.current_price
    ? (market.current_price / 100).toFixed(2)
    : "0.00";

  const targetPrice = market.target_price
    ? (market.target_price / 100).toFixed(2)
    : "0.00";

  const lastTradedPrice = orderbook?.last_traded_price
    ? (toCents(orderbook.last_traded_price) / 100).toFixed(3)
    : "0.00";

  const currentPriceNum = market.current_price
    ? market.current_price / 100
    : 0.50;

  // Preset handlers - UPDATED
  const presets = [10, 25, 50, 100];

  const handlePreset = (amount: number) => {
    setQuantity(amount.toString());
  };

  const handleMax = () => {
    const maxPossible = Math.floor(1000 / currentPriceNum);
    setQuantity(Math.max(10, maxPossible).toString());
  };

  const timeLeftText = formatDistanceToNow(new Date(market.end_time_utc), { addSuffix: true });

  const handlePlaceOrder = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (!token) {
      toast.error("Please login to trade");
      return;
    }

    if (!effectiveQuantity || effectiveQuantity <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    const orderData = {
      market_id: market.id,
      side: selectedSide,
      type: orderType,
      price: orderType === "LIMIT" ? parseFloat(price) : undefined,
      quantity: effectiveQuantity,
      is_demo: localStorage.getItem("mode") === "demo",
    };

    try {
      setSubmitting(true);
      await placeOrder(token, orderData);
      toast.success("Order placed successfully!");
      setQuantity("");
      setPrice("");
      loadOrderbook();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const effectiveQuantity = useMemo(() => {
    if (inputMode === "shares") return parseFloat(quantity) || 0;
    const usd = parseFloat(usdAmount) || 0;
    const px = orderType === "LIMIT" ? (parseFloat(price) || 0) : selectedSideDollars;
    return px > 0 ? usd / px : 0;
  }, [inputMode, quantity, usdAmount, orderType, price, selectedSideDollars]);

  const maxWin = effectiveQuantity ? (effectiveQuantity * 100).toFixed(2) : "0.00";

  const estimatedCost = effectiveQuantity && orderType === "MARKET"
    ? (effectiveQuantity * selectedSideDollars).toFixed(2)
    : effectiveQuantity && price
      ? (effectiveQuantity * parseFloat(price)).toFixed(2)
      : "0.00";

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-white">{market.title}</h2>
              <Badge variant="outline" className={cn(
                "border-green-500/50 text-green-400",
                timeLeft.seconds <= 0 && "border-yellow-500/50 text-yellow-400"
              )}>
                {timeLeft.seconds <= 0 ? "Settling" : "Active"}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
              <Clock size={14} />
              <span className={cn(
                "font-mono",
                timeLeft.seconds <= 60 && timeLeft.seconds > 0 ? "text-red-400" : "text-gray-400"
              )}>
                {timeLeft.text}
              </span>
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Current</p>
            <p className="text-xl font-mono text-white">${currentPrice}</p>
          </div>
        </div>

        {/* Market Info */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <p className="text-gray-300 text-sm">{market.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/5">
              <div>
                <p className="text-gray-500 text-xs mb-1">Current Price</p>
                <p className="text-lg font-mono text-white flex items-center gap-2">
                  <Activity size={14} className="text-blue-400" />
                  ${currentPrice}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Target</p>
                <p className="text-lg font-mono text-white flex items-center gap-2">
                  <Target size={14} className={market.direction === "Above" ? "text-green-400" : "text-red-400"} />
                  ${targetPrice}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Last Traded</p>
                <p className="text-lg font-mono text-white flex items-center gap-2">
                  <Activity size={14} className="text-purple-400" />
                  ${lastTradedPrice}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart section — only for crypto markets */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {/* Chart */}
          <div className="p-4">
            {chartType === 'candlestick' ? (
              <CandlestickChart title="BTC Spot Price (1m)" />
            ) : (
              <OpinionTrendChart
                marketId={market.id}
                title="YES / NO Sentiment"
              />
            )}
          </div>

          {/* Switcher (BOTTOM, centered) */}
          <div className="flex items-center justify-end gap-1 px-4 pb-3 border-b border-white/10"> <button onClick={() => setChartType('candlestick')} className={cn("p-2 rounded-lg transition-colors", chartType === 'candlestick' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5")} title="Candlestick chart" > <BarChart2 size={16} /> </button> <button onClick={() => setChartType('opinion')} className={cn("p-2 rounded-lg transition-colors", chartType === 'opinion' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5")} title="Opinion trend" > <LineChart size={16} /> </button> </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Orderbook */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-white">Orderbook</h3>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="YES" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/5">
                  <TabsTrigger value="YES">YES</TabsTrigger>
                  <TabsTrigger value="NO">NO</TabsTrigger>
                </TabsList>

                <TabsContent value="YES" className="mt-4">
                  <OrderbookTable
                    bids={orderbook?.yes_bids || []}
                    asks={orderbook?.yes_asks || []}
                    loading={loading}
                  />
                </TabsContent>

                <TabsContent value="NO" className="mt-4">
                  <OrderbookTable
                    bids={orderbook?.no_bids || []}
                    asks={orderbook?.no_asks || []}
                    loading={loading}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* <PositionCard
              side="NO"
              shares={250}
              avgEntry={0.42}
              currentPrice={orderbook?.last_traded_price ?? 0.50}
              unrealizedPnl={32.50}
              pnlPercent={18.4}
            /> */}

            {/* Order Form */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <h3 className="font-semibold text-white">Place Order</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Side Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedSide === "YES" ? "default" : "outline"}
                    className={cn(
                      "h-12",
                      selectedSide === "YES"
                        ? "bg-green-600 hover:bg-green-700"
                        : "border-white/20 text-gray-300 hover:bg-white/5"
                    )}
                    onClick={() => setSelectedSide("YES")}
                  >
                    YES {yesCents.toFixed(1)}¢
                  </Button>
                  <Button
                    variant={selectedSide === "NO" ? "default" : "outline"}
                    className={cn(
                      "h-12",
                      selectedSide === "NO"
                        ? "bg-red-600 hover:bg-red-700"
                        : "border-white/20 text-gray-300 hover:bg-white/5"
                    )}
                    onClick={() => setSelectedSide("NO")}
                  >
                    NO {noCents.toFixed(1)}¢
                  </Button>
                </div>

                {/* Order Type */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={orderType === "MARKET" ? "default" : "outline"}
                    className={cn(
                      orderType === "MARKET"
                        ? "bg-white/10 hover:bg-white/20"
                        : "border-white/20 text-gray-300 hover:bg-white/5"
                    )}
                    onClick={() => setOrderType("MARKET")}
                  >
                    Market
                  </Button>
                  <Button
                    variant={orderType === "LIMIT" ? "default" : "outline"}
                    className={cn(
                      orderType === "LIMIT"
                        ? "bg-white/10 hover:bg-white/20"
                        : "border-white/20 text-gray-300 hover:bg-white/5"
                    )}
                    onClick={() => setOrderType("LIMIT")}
                  >
                    Limit
                  </Button>
                </div>

                {/* Price Input (Limit only) */}
                {orderType === "LIMIT" && (
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-gray-400">
                      Price (USD per share)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-12"
                      step="0.01"
                      min="0.01"
                      max="99.99"
                    />
                  </div>
                )}

                {/* Quantity Input */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-gray-400">
                    Order Size
                  </Label>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Button type="button" variant={inputMode === "shares" ? "default" : "outline"} onClick={() => setInputMode("shares")}>Shares</Button>
                    <Button type="button" variant={inputMode === "usd" ? "default" : "outline"} onClick={() => setInputMode("usd")}>USD</Button>
                  </div>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {presets.map((amt) => (
                      <Button
                        key={amt}
                        variant={parseFloat(quantity) === amt ? "default" : "outline"}
                        onClick={() => handlePreset(amt)}
                        className="h-12 font-medium"
                      >
                        {amt}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      onClick={handleMax}
                      className="h-12 font-medium"
                    >
                      MAX
                    </Button>
                  </div>

                  {inputMode === "shares" ? (
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-12"
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    <Input
                      id="usdAmount"
                      type="number"
                      placeholder="0.00"
                      value={usdAmount}
                      onChange={(e) => setUsdAmount(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-12"
                      step="0.01"
                      min="0"
                    />
                  )}
                </div>
                {/* Summary */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Estimated Cost</span>
                    <span className="text-white font-mono">${estimatedCost}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Max Win</span>
                    <span className="text-green-400 font-mono">${maxWin}</span>
                  </div>
                </div>

                <Button
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold"
                  onClick={handlePlaceOrder}
                  disabled={submitting || effectiveQuantity <= 0}
                >
                  {submitting ? "Placing Order..." : `Buy ${selectedSide}`}
                </Button>
              </CardContent>
            </Card>
          </div>   {/* Right column ends here */}
        </div>     {/* Grid ends here */}
      </div>       {/* Main space-y-6 ends here */}

      {/* Quick Trade Modal */}
      <QuickTradeModal
        isOpen={isQuickTradeOpen}
        onClose={() => setIsQuickTradeOpen(false)}
        market={market}
        selectedSide={selectedSide}
      />
    </>
  );
}



interface OrderbookTableProps {
  bids: { price: number; quantity: number; orders: number }[];
  asks: { price: number; quantity: number; orders: number }[];
  loading: boolean;
}


function OrderbookTable({ bids, asks, loading }: OrderbookTableProps) {
  if (loading) {
    return <div className="text-center py-6 text-gray-400">Loading...</div>;
  }

  const sortedBids = [...bids].sort((a, b) => b.price - a.price).slice(0, 15);
  const sortedAsks = [...asks].sort((a, b) => a.price - b.price).slice(0, 15);

  // cumulative depth
  let cumulative = 0;
  const asksWithDepth = sortedAsks.map(a => {
    cumulative += a.quantity;
    return { ...a, cumulative };
  });

  cumulative = 0;
  const bidsWithDepth = sortedBids.map(b => {
    cumulative += b.quantity;
    return { ...b, cumulative };
  });

  const maxDepth = Math.max(
    ...asksWithDepth.map(a => a.cumulative),
    ...bidsWithDepth.map(b => b.cumulative),
    1
  );

  const bestBid = sortedBids[0]?.price || 0;
  const bestAsk = sortedAsks[0]?.price || 0;
  const toCents = (v: number) => (v <= 1 ? v * 100 : v);
  const mid = bestBid && bestAsk ? ((toCents(bestBid) + toCents(bestAsk)) / 2).toFixed(1) : "--";

  return (
    <div className="text-[11px] font-mono">
      {/* Header */}
      <div className="grid grid-cols-3 px-2 text-gray-500 pb-1">
        <span>Price</span>
        <span className="text-center">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* ASKS */}
      <div>
        {asksWithDepth.slice().reverse().map((a, i) => {
          const width = (a.cumulative / maxDepth) * 100;

          return (
            <div key={i} className="relative grid grid-cols-3 px-2 py-[1px]">
              <div
                className="absolute right-0 top-0 h-full bg-red-500/20"
                style={{ width: `${width}%` }}
              />
              <span className="text-red-400 z-10">{toCents(a.price).toFixed(1)}¢</span>
              <span className="text-center text-gray-300 z-10">{a.quantity}</span>
              <span className="text-right text-gray-500 z-10">{a.cumulative}</span>
            </div>
          );
        })}
      </div>

      {/* MID */}
      <div className="text-center py-2 border-y border-white/10 my-1 text-white">
        {mid}¢
      </div>

      {/* BIDS */}
      <div>
        {bidsWithDepth.map((b, i) => {
          const width = (b.cumulative / maxDepth) * 100;

          return (
            <div key={i} className="relative grid grid-cols-3 px-2 py-[1px]">
              <div
                className="absolute right-0 top-0 h-full bg-green-500/20"
                style={{ width: `${width}%` }}
              />
              <span className="text-green-400 z-10">{toCents(b.price).toFixed(1)}¢</span>
              <span className="text-center text-gray-300 z-10">{b.quantity}</span>
              <span className="text-right text-gray-500 z-10">{b.cumulative}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
