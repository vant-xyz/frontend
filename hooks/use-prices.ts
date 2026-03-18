"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { connectToPriceFeed, getLatestPrices, getVantRate, type PriceData, type PriceUpdate } from "@/lib/api";

export function usePrices() {
  const [prices, setPrices] = useState<PriceData & { vant_rate: number | null }>({
    BTC: null,
    ETH: null,
    SOL: null,
    NGN: null,
    USDC: null,
    USDT: null,
    vant_rate: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchInitialPrices = useCallback(async () => {
    try {
      const [pricesRes, vantRes] = await Promise.all([
        getLatestPrices(),
        getVantRate()
      ]);
      
      // Correctly map the nested "prices" object from the backend
      // Backend uses "SOL-USD", "USD-NGN", etc.
      const rawPrices = (pricesRes as any).prices || {};
      
      const mappedPrices: Partial<PriceData> = {
        BTC: rawPrices["BTC-USD"] || null,
        ETH: rawPrices["ETH-USD"] || null,
        SOL: rawPrices["SOL-USD"] || null,
        NGN: rawPrices["USD-NGN"] || null,
        USDC: rawPrices["USDC-USD"] || null,
        USDT: rawPrices["USDT-USD"] || null,
      };

      setPrices((prev) => ({ 
        ...prev, 
        ...mappedPrices,
        vant_rate: vantRes.buy_rate 
      }));
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
      setLoading(false);
    }
  }, []);

  const handlePriceUpdate = useCallback((priceUpdate: PriceUpdate) => {
    setPrices((prev) => {
      const symbol = priceUpdate.symbol.replace("-USD", "").replace("USD-", "") as keyof PriceData;
      const validSymbols: (keyof PriceData)[] = ["BTC", "ETH", "SOL", "NGN", "USDC", "USDT"];
      
      if (validSymbols.includes(symbol)) {
        return { ...prev, [symbol]: priceUpdate };
      }
      return prev;
    });
  }, []);

  const connectWebSocket = useCallback(() => {
    try {
      if (wsRef.current) wsRef.current.close();
      wsRef.current = connectToPriceFeed(handlePriceUpdate, (wsError) => {
        console.error("WebSocket error:", wsError);
      });
    } catch (err) {
      console.error("Failed to connect WebSocket:", err);
    }
  }, [handlePriceUpdate]);

  useEffect(() => {
    fetchInitialPrices();
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchInitialPrices, connectWebSocket]);

  return { prices, loading, error, refetch: fetchInitialPrices };
}
