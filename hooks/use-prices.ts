"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { connectToPriceFeed, getLatestPrices, type PriceData, type PriceUpdate } from "@/lib/api";

export function usePrices() {
  const [prices, setPrices] = useState<PriceData>({
    BTC: null,
    ETH: null,
    SOL: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial prices via REST
  const fetchInitialPrices = useCallback(async () => {
    try {
      const data = await getLatestPrices();
      setPrices(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
      setLoading(false);
    }
  }, []);

  // Handle price update from WebSocket
  const handlePriceUpdate = useCallback((priceUpdate: PriceUpdate) => {
    setPrices((prev) => {
      const symbol = priceUpdate.symbol.replace("-USD", "") as keyof PriceData;
      
      if (symbol === "BTC" || symbol === "ETH" || symbol === "SOL") {
        return {
          ...prev,
          [symbol]: priceUpdate,
        };
      }
      
      return prev;
    });
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      wsRef.current = connectToPriceFeed(
        handlePriceUpdate,
        (wsError) => {
          console.error("WebSocket error:", wsError);
        }
      );
    } catch (err) {
      console.error("Failed to connect WebSocket:", err);
    }
  }, [handlePriceUpdate]);

  // Initial load and WebSocket connection
  useEffect(() => {
    fetchInitialPrices();
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchInitialPrices, connectWebSocket]);

  // Reconnect WebSocket on disconnect
  useEffect(() => {
    const ws = wsRef.current;

    if (!ws) return;

    const handleDisconnect = () => {
      console.log("WebSocket disconnected, reconnecting...");
      setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    ws.addEventListener("close", handleDisconnect);

    return () => {
      ws.removeEventListener("close", handleDisconnect);
    };
  }, [connectWebSocket]);

  return {
    prices,
    loading,
    error,
    refetch: fetchInitialPrices,
  };
}
