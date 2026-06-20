"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M1 1l10 10M11 1L1 11" />
    </svg>
  );
}

function PickerInner({
  wallets,
  onSelect,
  onClose,
  isLoading,
  step,
}: {
  wallets: ReturnType<typeof useWallet>["wallets"];
  onSelect: (name: string) => void;
  onClose: () => void;
  isLoading: boolean;
  step: Step;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-white">Connect Wallet</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Choose a Solana wallet to continue</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition text-zinc-400 hover:text-white"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="space-y-2">
        {wallets.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-sm">
            <p>No wallets detected.</p>
            <p className="text-xs mt-1 text-zinc-600">Install Phantom or Solflare to continue.</p>
          </div>
        ) : (
          wallets.map((w) => (
            <button
              key={w.adapter.name}
              onClick={() => onSelect(w.adapter.name)}
              disabled={isLoading}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] hover:border-white/15 transition-all disabled:opacity-50"
            >
              {w.adapter.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.adapter.icon} alt={w.adapter.name} className="w-7 h-7 rounded-[8px] shrink-0" />
              )}
              <span className="text-sm font-semibold text-white">{w.adapter.name}</span>
              <span className="ml-auto text-[10px] text-zinc-600 font-medium uppercase tracking-wide">
                {w.readyState === "Installed" ? "Installed" : ""}
              </span>
            </button>
          ))
        )}
      </div>

      {isLoading && (
        <p className="text-center text-xs text-zinc-500 mt-4">
          {step === "connecting" && "Connecting to wallet…"}
          {step === "signing" && "Sign the message in your wallet…"}
          {step === "verifying" && "Verifying signature…"}
        </p>
      )}
    </>
  );
}

function WalletPicker({
  wallets,
  onSelect,
  onClose,
  step,
}: {
  wallets: ReturnType<typeof useWallet>["wallets"];
  onSelect: (name: string) => void;
  onClose: () => void;
  step: Step;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const isLoading = step !== "idle";

  const content = (
    <>
      <style>{`
        @keyframes vantic-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes vantic-drawer-in {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes vantic-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          animation: "vantic-backdrop-in 0.22s ease both",
        }}
      />

      {isMobile ? (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
          borderRadius: "20px 20px 0 0",
          background: "#0d0505",
          borderTop: "1px solid rgba(255,255,255,0.10)",
          padding: "24px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          animation: "vantic-drawer-in 0.32s cubic-bezier(0.32,0.72,0,1) both",
        }}>
          <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 99, margin: "0 auto 20px" }} />
          <PickerInner wallets={wallets} onSelect={onSelect} onClose={onClose} isLoading={isLoading} step={step} />
        </div>
      ) : (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            width: "100%", maxWidth: 380,
            background: "#0d0505",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 20, padding: 24,
            boxShadow: "0 8px 60px rgba(0,0,0,0.8)",
            animation: "vantic-modal-in 0.24s cubic-bezier(0.16,1,0.3,1) both",
          }}>
            <PickerInner wallets={wallets} onSelect={onSelect} onClose={onClose} isLoading={isLoading} step={step} />
          </div>
        </div>
      )}
    </>
  );

  return createPortal(content, document.body);
}

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
    signing: "Awaiting signature…",
    verifying: "Verifying…",
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={className || "w-full py-3 px-4 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-[10px] disabled:opacity-50 transition-colors shadow-lg shadow-red-950/40"}
      >
        {stepLabel[step]}
      </button>

      {showPicker && (
        <WalletPicker
          wallets={wallets}
          onSelect={handleConnect}
          onClose={() => setShowPicker(false)}
          step={step}
        />
      )}
    </>
  );
}
