"use client";

import { useState, useEffect, useCallback } from "react";
import { Market, getOrderbook, OrderbookSnapshot, placeOrder, OrderSide, OrderType } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, TrendingUp, TrendingDown, Activity, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { QuickTradeModal } from "./quick-trade-modal";
import { Loader } from "@/components/ui/loader";

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
  const [quantity, setQuantity] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ seconds: number; text: string }>({ seconds: 0, text: "" });

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
    const interval = setInterval(loadOrderbook, 500);
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
    ? orderbook.last_traded_price.toFixed(2)
    : "0.00";

  const timeLeftText = formatDistanceToNow(new Date(market.end_time_utc), { addSuffix: true });

  const handlePlaceOrder = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    
    if (!token) {
      toast.error("Please login to trade");
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    const orderData = {
      market_id: market.id,
      side: selectedSide,
      type: orderType,
      price: orderType === "LIMIT" ? parseFloat(price) : undefined,
      quantity: parseFloat(quantity),
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

  const maxWin = quantity 
    ? (parseFloat(quantity) * 100).toFixed(2)
    : "0.00";

  const estimatedCost = quantity && orderType === "MARKET"
    ? (parseFloat(quantity) * (orderbook?.last_traded_price || 50)).toFixed(2)
    : quantity && price
    ? (parseFloat(quantity) * parseFloat(price)).toFixed(2)
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
                  YES
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
                  NO
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
                    Price (NGN per share)
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
                  Quantity (shares)
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12"
                  step="1"
                  min="1"
                />
              </div>

              {/* Summary */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated Cost</span>
                  <span className="text-white font-mono">₦{estimatedCost}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Max Win</span>
                  <span className="text-green-400 font-mono">₦{maxWin}</span>
                </div>
              </div>

              <Button
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={handlePlaceOrder}
                disabled={submitting || !quantity}
              >
                {submitting ? "Placing Order..." : `Buy ${selectedSide}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

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
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 text-red-600" />
      </div>
    );
  }

  const sortedBids = [...bids].sort((a, b) => b.price - a.price).slice(0, 10);
  const sortedAsks = [...asks].sort((a, b) => a.price - b.price).slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 text-xs text-gray-500 pb-2 border-b border-white/10">
        <span>Price (NGN)</span>
        <span className="text-center">Shares</span>
        <span className="text-right">Orders</span>
      </div>
      
      {/* Asks (sellers) - red */}
      <div className="space-y-1">
        {sortedAsks.slice().reverse().map((ask, i) => (
          <div key={`ask-${i}`} className="grid grid-cols-3 text-sm">
            <span className="text-red-400 font-mono">{ask.price.toFixed(2)}</span>
            <span className="text-center text-gray-300">{ask.quantity}</span>
            <span className="text-right text-gray-500">{ask.orders}</span>
          </div>
        ))}
      </div>

      {/* Spread */}
      {sortedBids.length > 0 && sortedAsks.length > 0 && (
        <div className="py-2 text-center text-xs text-gray-500 border-y border-white/10">
          Spread: {(sortedAsks[0]?.price - sortedBids[0]?.price).toFixed(2)} NGN
        </div>
      )}

      {/* Bids (buyers) - green */}
      <div className="space-y-1">
        {sortedBids.map((bid, i) => (
          <div key={`bid-${i}`} className="grid grid-cols-3 text-sm">
            <span className="text-green-400 font-mono">{bid.price.toFixed(2)}</span>
            <span className="text-center text-gray-300">{bid.quantity}</span>
            <span className="text-right text-gray-500">{bid.orders}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
