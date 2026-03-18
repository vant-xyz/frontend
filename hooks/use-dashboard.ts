"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getUserProfile,
  getBalance,
  syncBalance,
  fundDemoAccount,
  connectToPriceFeed,
  getLatestPrices,
  getVantRate,
  UserProfile,
  BalanceInfo,
  PriceData,
  PriceUpdate,
} from "@/lib/api";

export function useDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vant_mode") === "demo";
    }
    return false;
  });
  const [prices, setPrices] = useState<PriceData & { vant_rate: number | null }>({
    BTC: null, ETH: null, SOL: null, NGN: null, USDC: null, USDT: null, vant_rate: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

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
  
  const sync = useCallback(async () => {
    if (!token) return;
    try {
      setIsSyncing(true);
      const res = await syncBalance(token);
      setBalance(res.balance);
    } catch (err) {
      console.error("Failed to sync balance:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [token]);

  const fetchData = useCallback(async () => {
    if (!token) {
      setError("No authentication token found");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [userRes, balanceRes, pricesRes, vantRes] = await Promise.all([
        getUserProfile(token),
        getBalance(token),
        getLatestPrices(),
        getVantRate(),
      ]);

      setUserProfile(userRes.user);
      setBalance(balanceRes.balance);

      const rawPrices = (pricesRes as any).prices || {};
      const mappedPrices: Partial<PriceData> = {
        BTC: rawPrices["BTC-USD"], ETH: rawPrices["ETH-USD"], SOL: rawPrices["SOL-USD"],
        NGN: rawPrices["USD-NGN"], USDC: rawPrices["USDC-USD"], USDT: rawPrices["USDT-USD"],
      };
      setPrices((prev) => ({ ...prev, ...mappedPrices, vant_rate: vantRes.buy_rate }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch initial data");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    if (!token) return;

    const handleWsMessage = (data: any) => {
      if (data.type === "BALANCE_UPDATE") {
        console.log("Balance update received! Re-syncing...");
        sync();
      } else if (data.type === "PRICE_UPDATE" || (data.symbol && data.price)) {
        handlePriceUpdate(data);
      }
    };
    
    wsRef.current = connectToPriceFeed(token, handleWsMessage);
    
    return () => {
      wsRef.current?.close();
    };
  }, [token, sync, fetchData, handlePriceUpdate]);
  
  const toggleDemoReal = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      localStorage.setItem("vant_mode", next ? "demo" : "real");
      return next;
    });
  }, []);

  const handleFundDemo = useCallback(async (amount: number = 20000) => {
    if (!token) return Promise.reject("No token");
    try {
      const res = await fundDemoAccount(token, amount);
      await sync(); // Use sync instead of full fetchData
      return res;
    } catch (err) {
      console.error("Failed to fund demo account:", err);
      throw err;
    }
  }, [token, sync]);

  const currentBalance = balance
    ? isDemoMode
      ? balance.total_demo_naira
      : balance.total_naira
    : null;

  return {
    isLoading,
    isSyncing,
    error,
    userProfile,
    balance,
    prices,
    currentBalance,
    isDemoMode,
    toggleDemoReal,
    fundDemo: handleFundDemo,
    sync,
    refresh: fetchData,
  };
}
