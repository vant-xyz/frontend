"use client";

import { useEffect, useState } from "react";

interface V2AuthState {
  token: string | null;
  walletPubkey: string | null;
  isV2: boolean;
}

export function useV2Auth(): V2AuthState {
  const [state, setState] = useState<V2AuthState>({
    token: null,
    walletPubkey: null,
    isV2: false,
  });

  useEffect(() => {
    const t = localStorage.getItem("auth_token");
    if (!t) return;
    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      if (payload.wallet_pubkey) {
        setState({ token: t, walletPubkey: payload.wallet_pubkey, isV2: true });
      }
    } catch {}
  }, []);

  return state;
}
