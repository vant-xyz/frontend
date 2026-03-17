"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getUserProfile,
  getBalance,
  fundDemoAccount,
  UserProfile,
  BalanceInfo,
  WalletInfo,
} from "@/lib/api";

export function useDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

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
    setIsDemoMode((prev) => !prev);
  }, []);

  const handleFundDemo = useCallback(async () => {
    if (!token) return;

    try {
      await fundDemoAccount(token);
      await fetchData();
    } catch (err) {
      console.error("Failed to fund demo account:", err);
      throw err;
    }
  }, [token, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentBalance = balance
    ? isDemoMode
      ? balance.demo
      : balance.real
    : null;

  const wallets = userProfile?.wallets ?? [];

  return {
    isLoading,
    error,
    userProfile,
    balance,
    currentBalance,
    isDemoMode,
    wallets,
    toggleDemoReal,
    fundDemo: handleFundDemo,
    refresh: fetchData,
  };
}
