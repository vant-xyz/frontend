"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getUserProfile,
  getBalance,
  syncBalance,
  fundDemoAccount,
  UserProfile,
  BalanceInfo,
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

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const fetchData = useCallback(async () => {
    if (!token) {
      setError("No authentication token found");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [userRes, balanceRes] = await Promise.all([
        getUserProfile(token),
        getBalance(token),
      ]);

      setUserProfile(userRes.user);
      setBalance(balanceRes.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const toggleDemoReal = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      localStorage.setItem("vant_mode", next ? "demo" : "real");
      return next;
    });
  }, []);

  const handleFundDemo = useCallback(async (amount: number = 20000) => {
    if (!token) return;

    try {
      const res = await fundDemoAccount(token, amount);
      await fetchData();
      return res;
    } catch (err) {
      console.error("Failed to fund demo account:", err);
      throw err;
    }
  }, [token, fetchData]);

  const handleSyncBalance = useCallback(async () => {
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentBalance = balance
    ? isDemoMode
      ? balance.total_demo_naira
      : balance.total_naira
    : null;

  const wallets = userProfile?.vant_id ? [userProfile.vant_id] : [];

  return {
    isLoading,
    isSyncing,
    error,
    userProfile,
    balance,
    currentBalance,
    isDemoMode,
    wallets,
    toggleDemoReal,
    fundDemo: handleFundDemo,
    sync: handleSyncBalance,
    refresh: fetchData,
  };
}
