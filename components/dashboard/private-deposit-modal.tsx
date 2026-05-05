"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { getUserProfile } from "@/lib/api";
import { toast } from "sonner";
import {
  ShieldCheck,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Copy,
  Info,
} from "lucide-react";
import {
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToEncryptedBalanceDirectDepositorFunction,
  getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction,
  createSignerFromWalletAccount,
  getUserAccountQuerierFunction,
} from "@umbra-privacy/sdk";
import { getWallets } from "@wallet-standard/app";

// const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const DEVNET_WSOL_MINT = "So11111111111111111111111111111111111111112";

type Step = "intro" | "connect" | "shield" | "unshield" | "done";

interface PrivateDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDemoMode: boolean;
}

export function PrivateDepositModal({ isOpen, onClose, isDemoMode }: PrivateDepositModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [connecting, setConnecting] = useState(false);
  const [externalAddress, setExternalAddress] = useState("");
  const [vanticAddress, setVanticAddress] = useState("");
  const [umbraClient, setUmbraClient] = useState<any>(null);
  const [shieldAmount, setShieldAmount] = useState("");
  const [unshieldAmount, setUnshieldAmount] = useState("");
  const [isShielding, setIsShielding] = useState(false);
  const [isUnshielding, setIsUnshielding] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setStep("intro");
      setExternalAddress("");
      setVanticAddress("");
      setUmbraClient(null);
      setShieldAmount("");
      setUnshieldAmount("");
    }
  }, [isOpen]);



  const handleConnect = async () => {
    setConnecting(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const userRes = await getUserProfile(token);
      setVanticAddress(userRes.wallet.sol_public_key);

      const { get } = getWallets();
      const solanaWallets = get().filter((w) => {
        const features = Object.keys(w.features);
        return (
          features.includes("solana:signTransaction") &&
          features.includes("solana:signMessage")
        );
      });

      if (!solanaWallets.length) throw new Error("No compatible Solana wallet found.");

      const wallet =
        solanaWallets.find((w) => w.name === "Solflare") ||
        solanaWallets.find((w) => w.name === "Phantom") ||
        solanaWallets[0];

      const connectFeature = wallet.features["standard:connect"] as any;
      if (!connectFeature) throw new Error("Wallet does not support standard:connect");

      const { accounts } = await connectFeature.connect();
      const account = accounts[0];
      if (!account) throw new Error("No accounts found. Unlock your wallet.");

      setExternalAddress(account.address);

      const signer = createSignerFromWalletAccount(wallet, account);

      const client = await getUmbraClient({
        signer,
        network: isDemoMode ? "devnet" : "mainnet",
        rpcUrl: isDemoMode ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com",
        rpcSubscriptionsUrl: isDemoMode ? "wss://api.devnet.solana.com" : "wss://api.mainnet-beta.solana.com",
        deferMasterSeedSignature: false,
      });

      setUmbraClient(client);

      const query = getUserAccountQuerierFunction({ client });
      const result = await query(account.address as any);




      const x25519IsValid = result.state === "exists" &&
        result.data.x25519PublicKey?.some((b: number) => b !== 0);

      const isFullyRegistered =
        result.state === "exists" &&
        result.data.isInitialised &&
        result.data.isUserAccountX25519KeyRegistered &&
        x25519IsValid;

      if (!isFullyRegistered) {
        console.log("Registration incomplete or corrupted — re-registering...");
        const register = getUserRegistrationFunction({ client });
        const sigs = await register({ confidential: true, anonymous: false });
        console.log(`Registration complete — ${sigs.length} transaction(s) submitted`);
      } else {
        console.log("Already registered — skipping");
      }
      setStep("shield");
    } catch (err) {
      console.log("Connect error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  const handleShield = async () => {
    if (!umbraClient || !shieldAmount) return;

    if (umbraClient.signer.address !== externalAddress) {
      toast.error("Wallet mismatch — please reconnect.");
      setStep("connect");
      return;
    }

    setIsShielding(true);
    try {
      const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client: umbraClient });
      const amount = BigInt(Math.floor(parseFloat(shieldAmount) * 1_000_000));

      await deposit(
        umbraClient.signer.address as any,
        DEVNET_WSOL_MINT as any,
        amount as any,
      );

      setUnshieldAmount(shieldAmount);
      setStep("unshield");
      toast.success("Funds shielded into Umbra");
    } catch (err) {
      console.log(err);
      toast.error(err instanceof Error ? err.message : "Shield failed");
    } finally {
      setIsShielding(false);
    }
  };
  const handleUnshield = async () => {
    if (!umbraClient || !unshieldAmount || !vanticAddress) return;
    setIsUnshielding(true);
    try {
      const withdraw = getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({ client: umbraClient });
      const amount = BigInt(Math.floor(parseFloat(unshieldAmount) * 1_000_000));
      await withdraw(vanticAddress as any, DEVNET_WSOL_MINT as any, amount as any);
      setStep("done");
      toast.success("Funds are on their way to your Vantic wallet");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unshield failed");
    } finally {
      setIsUnshielding(false);
    }
  };

  const truncate = (s: string) =>
    s.length > 12 ? `${s.slice(0, 6)}...${s.slice(-4)}` : s;

  const renderContent = () => {
    switch (step) {
      case "intro":
        return (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                <ShieldCheck size={32} className="text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Private Deposit</h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  Deposit from any external wallet without linking it to your Vantic identity.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { step: "1", label: "Connect any Solana wallet", sub: "Phantom, Solflare — not your Vantic wallet" },
                { step: "2", label: "Shield funds into Umbra", sub: "USDC goes into Arcium's private pool" },
                { step: "3", label: "Unshield to your Vantic wallet", sub: "Funds land on your Vantic address" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="text-[11px] text-gray-500">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-300">
                The on-chain link between your source wallet and Vantic wallet is broken by Umbra's Arcium MPC network.
              </p>
            </div>

            <Button
              onClick={() => setStep("connect")}
              className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] shadow-none"
            >
              Get Started
              <ArrowRight size={14} className="ml-2" />
            </Button>
          </div>
        );

      case "connect":
        return (
          <div className="space-y-6 py-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Connect External Wallet
            </p>
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-4 text-center">
              <Wallet size={32} className="text-gray-600" />
              <div>
                <p className="text-sm font-bold text-white">Use a fresh wallet</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Connect a wallet that is NOT your Vantic wallet. This is your anonymous source.
                </p>
              </div>
            </div>
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] shadow-none disabled:opacity-50"
            >
              {connecting ? <Loader className="text-white" /> : "Connect Wallet"}
            </Button>
          </div>
        );

      case "shield":
        return (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Shield USDC</p>
              <span className="text-[10px] text-gray-600 font-mono">{truncate(externalAddress)}</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount (USDC)</p>
                <Input
                  type="number"
                  value={shieldAmount}
                  onChange={(e) => setShieldAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xl font-black text-white px-4 focus:ring-red-500/50"
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <Info size={13} className="text-gray-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-gray-500">
                  Funds will be deposited into your Umbra encrypted balance. Make sure your external wallet has enough balance and SOL for fees.
                </p>
              </div>
            </div>

            <Button
              onClick={handleShield}
              disabled={isShielding || !shieldAmount || parseFloat(shieldAmount) <= 0}
              className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] shadow-none disabled:opacity-30"
            >
              {isShielding ? <Loader className="text-white" /> : (
                <><ShieldCheck size={13} className="mr-2" />Shield into Umbra</>
              )}
            </Button>
          </div>
        );

      case "unshield":
        return (
          <div className="space-y-6 py-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Unshield to Vantic Wallet</p>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Destination</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white font-mono">{truncate(vanticAddress)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(vanticAddress);
                      toast.success("Copied");
                    }}
                    className="text-gray-500 hover:text-white"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Amount</span>
                <span className="text-[11px] text-white font-mono">{unshieldAmount} USDC</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-300">
                After unshielding, funds will appear at your Vantic wallet address. Your Vantic balance will update automatically.
              </p>
            </div>

            <Button
              onClick={handleUnshield}
              disabled={isUnshielding}
              className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] shadow-none disabled:opacity-50"
            >
              {isUnshielding ? <Loader className="text-white" /> : (
                <>Unshield to Vantic<ArrowRight size={13} className="ml-2" /></>
              )}
            </Button>
          </div>
        );

      case "done":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Private Deposit Complete</h3>
              <p className="text-sm text-gray-400">
                Funds are moving to your Vantic wallet via Umbra. Your balance will update once the transaction confirms.
              </p>
            </div>
            <Button
              onClick={onClose}
              className="h-10 px-8 rounded-xl bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest text-[10px] shadow-none"
            >
              Done
            </Button>
          </div>
        );
    }
  };

  const title = step === "intro" ? "Private Deposit" :
    step === "connect" ? "Connect Wallet" :
      step === "shield" ? "Shield Funds" :
        step === "unshield" ? "Unshield Funds" :
          "Complete";

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="bg-black border-white/10 px-4 pb-8 max-h-[95vh] outline-none">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle className="text-xl font-black text-white uppercase tracking-tight">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">{renderContent()}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black border-white/10 p-8 rounded-3xl shadow-2xl outline-none border">
        <DialogHeader className="text-left p-0 mb-2">
          <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
