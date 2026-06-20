"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [], []);

  // Build absolute URL at runtime so SSR prerender gets a valid http:// endpoint.
  const endpoint = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/solana/rpc`;
    }
    return "https://api.mainnet-beta.solana.com";
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* autoConnect so the wallet reconnects after the post-auth page reload —
          otherwise signTransaction is undefined and signing silently fails. */}
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
