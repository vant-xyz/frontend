"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import bs58 from "bs58";
import { getWalletNonce, verifyWalletSignature, type WalletAuthResponse } from "@/lib/api";

interface ConnectWalletButtonProps {
  onAuthSuccess?: (user: WalletAuthResponse["user"], token: string) => void;
  className?: string;
  label?: string;
}

type Step = "idle" | "connecting" | "signing" | "verifying";

export function ConnectWalletButton({
  onAuthSuccess,
  className,
  label = "Connect Wallet",
}: ConnectWalletButtonProps) {
  const { wallet, connect, disconnect, connected, publicKey, signMessage, select, wallets } =
    useWallet();
  const [step, setStep] = useState<Step>("idle");
  const [showPicker, setShowPicker] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!connected || !publicKey || !signMessage) return;

    try {
      setStep("signing");
      const address = publicKey.toBase58();

      const { message } = await getWalletNonce(address);

      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signatureBytes);

      setStep("verifying");
      const result = await verifyWalletSignature(address, signatureBase58);

      localStorage.setItem("auth_token", result.token);
      document.cookie = `auth_token=${result.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;

      toast.success("Signed in with wallet");
      onAuthSuccess?.(result.user, result.token);
    } catch (err: any) {
      toast.error(err?.message || "Sign-in failed");
    } finally {
      setStep("idle");
    }
  }, [connected, publicKey, signMessage, onAuthSuccess]);

  const handleConnect = useCallback(
    async (walletName: string) => {
      setShowPicker(false);
      try {
        setStep("connecting");
        select(walletName as any);
        await connect();
      } catch (err: any) {
        toast.error(err?.message || "Failed to connect wallet");
        setStep("idle");
        return;
      }
      setStep("idle");
    },
    [select, connect]
  );

  const handleClick = useCallback(() => {
    if (!connected) {
      setShowPicker(true);
      return;
    }
    handleSignIn();
  }, [connected, handleSignIn]);

  const isLoading = step !== "idle";
  const stepLabel: Record<Step, string> = {
    idle: connected ? "Sign in with Wallet" : label,
    connecting: "Connecting…",
    signing: "Sign the message in your wallet…",
    verifying: "Verifying…",
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={className || "w-full py-3 px-4 bg-white text-black font-semibold rounded-lg hover:bg-zinc-100 disabled:opacity-50 transition-colors"}
      >
        {stepLabel[step]}
      </button>

      {showPicker && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 space-y-2">
          {wallets.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-2">
              No wallets detected. Install Phantom or Solflare.
            </p>
          )}
          {wallets.map((w) => (
            <button
              key={w.adapter.name}
              onClick={() => handleConnect(w.adapter.name)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 transition-colors"
            >
              {w.adapter.icon && (
                <img src={w.adapter.icon} alt={w.adapter.name} className="w-6 h-6 rounded" />
              )}
              <span className="text-sm text-white">{w.adapter.name}</span>
            </button>
          ))}
          <button
            onClick={() => setShowPicker(false)}
            className="w-full text-xs text-zinc-500 py-1 hover:text-zinc-300"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
