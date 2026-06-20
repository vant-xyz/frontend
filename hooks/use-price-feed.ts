"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getLatestPrices, PriceData } from "@/lib/api";

interface UsePriceFeedProps {
  usePolling?: boolean;
  pollingInterval?: number;
}

export function usePriceFeed({ usePolling = false, pollingInterval = 2000 }: UsePriceFeedProps = {}) {
  const [prices, setPrices] = useState<PriceData & { vant_rate: number | null }>({
    BTC: null,
    ETH: null,
    SOL: null,
    USDC: null,
    USDT: null,
    vant_rate: null,
  });
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const fetchPrices = useCallback(async () => {
    try {
      const pricesRes = await getLatestPrices();
      const mappedPrices: Partial<PriceData> = {
        BTC: pricesRes["BTC-USD"] || null,
        ETH: pricesRes["ETH-USD"] || null,
        SOL: pricesRes["SOL-USD"] || null,
        USDC: pricesRes["USDC-USD"] || null,
        USDT: pricesRes["USDT-USD"] || null,
      };
      
      setPrices((prev) => {
        const updated = {
          ...prev,
          ...mappedPrices,
        };
        return updated;
      });
    } catch (err) {
      console.warn("Failed to fetch prices:", err);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (usePolling || !token) {
      pollingRef.current = setInterval(fetchPrices, pollingInterval);
      
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }

    if (!token) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/v1/ws";
    const authedWsUrl = `${wsUrl}?token=${token}`;

    try {
      wsRef.current = new WebSocket(authedWsUrl);

      wsRef.current.onopen = () => {
        setWsConnected(true);
        console.log("Price WebSocket connected");
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "PRICE_UPDATE" || (data.symbol && data.price)) {
            setPrices((prev) => {
              const symbol = data.symbol.replace("-USD", "").replace("USD-", "") as keyof PriceData;
              const validSymbols: (keyof PriceData)[] = ["BTC", "ETH", "SOL", "USDC", "USDT"];
              if (validSymbols.includes(symbol)) {
                return { ...prev, [symbol]: data };
              }
              return prev;
            });
          }
        } catch (err) {
          console.error("Failed to parse WS message:", err);
        }
      };

      wsRef.current.onerror = () => {
        setWsConnected(false);
        console.warn("WebSocket error - falling back to polling");
      };

      wsRef.current.onclose = () => {
        setWsConnected(false);
        if (!pollingRef.current) {
          pollingRef.current = setInterval(fetchPrices, 500);
        }
      };
    } catch (err) {
      console.warn("Failed to create WebSocket - using polling");
      pollingRef.current = setInterval(fetchPrices, 500);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [token, usePolling, pollingInterval, fetchPrices]);

  return {
    prices,
    wsConnected,
    refresh: fetchPrices,
  };
}
