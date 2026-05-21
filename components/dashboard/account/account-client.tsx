"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { UserResponse, updateUserProfile, uploadProfileImage, checkUsernameExists, logout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import { useDashboard } from "@/hooks/use-dashboard";
import {
  User,
  Wallet,
  Camera,
  Copy,
  ExternalLink,
  Twitter,
  Instagram,
  Globe,
  Check,
  X,
  LogOut,
  QrCode,
  AlertTriangle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface AccountClientProps {
  initialData: UserResponse;
  token: string;
}

export function AccountClient({ initialData, token }: AccountClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDemoMode } = useDashboard();
  const [user, setUser] = useState(initialData.user);
  const [wallet] = useState(initialData.wallet);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qrTarget, setQrTarget] = useState<{ address: string; chain: "solana" | "base" } | null>(null);
  const [showSupportedTokens, setShowSupportedTokens] = useState(false);
  const isMobile = useIsMobile();

  const SUPPORTED_TOKENS = {
    solana: [
      { symbol: "SOL", name: "Solana", icon: "/media/images/token_icons/solana.png" },
      { symbol: "USDC", name: "USD Coin", icon: "/media/images/token_icons/usdc.png" },
      { symbol: "USDT", name: "Tether", icon: "/media/images/token_icons/usdt.png" },
      { symbol: "USDG", name: "Global Dollar", icon: "/media/images/token_icons/usdg.png" },
      { symbol: "PUSD", name: "Palm USD", icon: "/media/images/token_icons/PalmUSD.png" },
    ],
    base: [
      { symbol: "ETH", name: "Ethereum", icon: "/media/images/token_icons/eth.png" },
      { symbol: "USDC", name: "USD Coin", icon: "/media/images/token_icons/usdc.png" },
    ],
  } as const;

  // Form states
  const [fullName, setFullName] = useState(user.full_name || "");
  const [username, setUsername] = useState(user.username);
  const [socials, setSocials] = useState<string[]>(user.socials || ["", "", ""]);
  
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Real-time username validation
  useEffect(() => {
    const cleanUsername = username.trim();
    if (cleanUsername === user.username) {
      setUsernameAvailable(null);
      return;
    }

    if (cleanUsername.replace("@", "").length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const result = await checkUsernameExists(cleanUsername.startsWith("@") ? cleanUsername : `@${cleanUsername}`);
        setUsernameAvailable(!result.exists);
      } catch (err) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, user.username]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usernameAvailable === false) {
      toast.error("Username is already taken");
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserProfile(token, {
        full_name: fullName,
        username: username.startsWith("@") ? username : `@${username}`,
        socials: socials.filter(s => s.trim() !== ""),
      });
      setUser(res.user);
      setUsernameAvailable(null);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadProfileImage(token, file);
      setUser({ ...user, profile_image_url: res.profile_image_url });
      toast.success("Profile image updated");
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const updateSocial = (index: number, value: string) => {
    const newSocials = [...socials];
    newSocials[index] = value;
    setSocials(newSocials);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const getSolanaExplorerUrl = (address: string) => {
    const cluster = isDemoMode ? "?cluster=devnet" : "";
    return `https://solscan.io/account/${address}${cluster}`;
  };

  const getBaseExplorerUrl = (address: string) => {
    const prefix = isDemoMode ? "sepolia." : "";
    return `https://${prefix}basescan.org/address/${address}`;
  };

  const requestedTab = searchParams.get("tab");
  const initialTab = requestedTab === "wallets" ? "wallets" : "profile";

  const handleLogout = async () => {
    try {
      await logout(token);
    } catch {
      // Best effort logout.
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_token_temp");
        document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
      }
      router.push("/");
    }
  };

  return (
    <Tabs defaultValue={initialTab} className="w-full space-y-6">
      <TabsList>
        <TabsTrigger value="profile">
          <User size={14} />
          Profile
        </TabsTrigger>
        <TabsTrigger value="wallets">
          <Wallet size={14} />
          Wallets
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="animate-in slide-in-from-bottom-4 duration-500">
        <Card className="bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden shadow-none">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg font-black text-white">Profile Details</CardTitle>
            <CardDescription className="text-gray-500">Manage your identity and public profile.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-8 px-6 space-y-10">
            <div className="flex flex-col items-center sm:flex-row sm:items-end gap-6 mb-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-white/10">
                  <AvatarImage src={user.profile_image_url} />
                  <AvatarFallback className="bg-red-600 text-2xl font-black text-white">
                    {user.username?.[1]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  <Camera size={24} className="text-white" />
                  <input type="file" className="hidden" onChange={handleImageUpload} disabled={uploading} accept="image/*" />
                </label>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader className="text-red-600" />
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-xl font-black text-white">{user.full_name || "Vantic User"}</h3>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-xs text-red-500 font-bold tracking-widest">{user.username}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-700" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {user.vant_id}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</Label>
                  <Input 
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl h-10 focus:ring-0 focus:border-white/20 transition-all shadow-none"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Username</Label>
                  <div className="relative">
                    <Input 
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={cn(
                        "bg-white/5 border-white/10 rounded-xl h-10 focus:ring-0 transition-all shadow-none",
                        usernameAvailable === true && "border-green-500/50 focus:border-green-500/50",
                        usernameAvailable === false && "border-red-500/50 focus:border-red-500/50"
                      )}
                      placeholder="@username"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingUsername && <Loader className="w-3 h-3 text-gray-500" />}
                      {usernameAvailable === true && <Check size={14} className="text-green-500" />}
                      {usernameAvailable === false && <X size={14} className="text-red-500" />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</Label>
                <Input 
                  value={user.email}
                  disabled
                  className="bg-white/5 border-white/5 rounded-xl h-10 text-gray-500 cursor-not-allowed shadow-none"
                />
              </div>

              <div className="pt-4 space-y-4">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Social Profiles</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Twitter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                      <Input 
                        value={socials[0] || ""}
                        onChange={(e) => updateSocial(0, e.target.value)}
                        className="bg-white/5 border-white/10 rounded-xl h-10 pl-10 focus:ring-0 focus:border-white/20 shadow-none text-xs"
                        placeholder="X (Twitter) URL"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                      <Input 
                        value={socials[1] || ""}
                        onChange={(e) => updateSocial(1, e.target.value)}
                        className="bg-white/5 border-white/10 rounded-xl h-10 pl-10 focus:ring-0 focus:border-white/20 shadow-none text-xs"
                        placeholder="Instagram URL"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input 
                        value={socials[2] || ""}
                        onChange={(e) => updateSocial(2, e.target.value)}
                        className="bg-white/5 border-white/10 rounded-xl h-10 pl-10 focus:ring-0 focus:border-white/20 shadow-none text-xs"
                        placeholder="Website URL"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading || usernameAvailable === false || checkingUsername}
                className="w-full md:w-auto px-8 bg-red-600 hover:bg-red-500 text-white font-bold h-10 rounded-xl transition-all shadow-none"
              >
                {loading ? <Loader className="text-black" /> : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="wallets" className="animate-in slide-in-from-bottom-4 duration-500">
        <Card className="bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden shadow-none">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg font-black text-white">Wallet Addresses</CardTitle>
            <CardDescription className="text-gray-500">Your secure deposit and withdrawal addresses.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-8 px-6 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Solana Wallet */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <img src="/media/images/token_icons/solana.png" alt="SOL" className="w-5 h-5 object-contain" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white tracking-tight">Solana Wallet {isDemoMode ? "(Devnet)" : "(Mainnet)"}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setQrTarget({ address: wallet.sol_public_key, chain: "solana" })}
                      className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg shadow-none"
                    >
                      <QrCode size={14} />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 h-10 flex items-center">
                      <code className="text-[10px] text-gray-400 font-mono">{truncateAddress(wallet.sol_public_key)}</code>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(wallet.sol_public_key, "Solana Address")}
                      className="h-10 w-10 bg-white/5 hover:bg-white/10 rounded-xl flex-shrink-0 shadow-none"
                    >
                      <Copy size={14} />
                    </Button>
                    <a
                      href={getSolanaExplorerUrl(wallet.sol_public_key)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="icon" variant="ghost" className="h-10 w-10 bg-white/5 hover:bg-white/10 rounded-xl flex-shrink-0 shadow-none">
                        <ExternalLink size={14} className="text-gray-500" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              {/* Base Wallet */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <img src="/media/images/token_icons/base.jpeg" alt="BASE" className="w-5 h-5 rounded-lg object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white tracking-tight">Base Wallet {isDemoMode ? "(Sepolia)" : "(Mainnet)"}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setQrTarget({ address: wallet.base_public_key, chain: "base" })}
                      className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg shadow-none"
                    >
                      <QrCode size={14} />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 h-10 flex items-center">
                      <code className="text-[10px] text-gray-400 font-mono">{truncateAddress(wallet.base_public_key)}</code>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(wallet.base_public_key, "Base Address")}
                      className="h-10 w-10 bg-white/5 hover:bg-white/10 rounded-xl flex-shrink-0 shadow-none"
                    >
                      <Copy size={14} />
                    </Button>
                    <a
                      href={getBaseExplorerUrl(wallet.base_public_key)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="icon" variant="ghost" className="h-10 w-10 bg-white/5 hover:bg-white/10 rounded-xl flex-shrink-0 shadow-none">
                        <ExternalLink size={14} className="text-gray-500" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl"
        >
          <LogOut size={14} className="mr-2" />
          Logout
        </Button>
      </div>

      {qrTarget && (() => {
        const isSolana = qrTarget.chain === "solana";
        const chainLabel = isSolana ? "Solana" : "Base";
        const tokenSymbols = SUPPORTED_TOKENS[qrTarget.chain].map((t) => t.symbol).join(", ");
        const content = (
          <div className="space-y-5 py-2">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG value={qrTarget.address} size={192} bgColor="#ffffff" fgColor="#000000" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-white">{chainLabel} Deposit Address</p>
              <code className="text-[10px] text-gray-400 font-mono break-all">{qrTarget.address}</code>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] text-yellow-300 leading-relaxed">
                  Only send <span className="font-bold">{tokenSymbols}</span> to this address. Sending unsupported tokens may result in permanent loss.
                </p>
                <button
                  onClick={() => setShowSupportedTokens(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                >
                  View supported tokens
                </button>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => copyToClipboard(qrTarget.address, `${chainLabel} Address`)}
            >
              <Copy size={14} />
              Copy Address
            </Button>
          </div>
        );

        if (isMobile) {
          return (
            <Drawer open onOpenChange={(open) => !open && setQrTarget(null)}>
              <DrawerContent className="bg-black border-white/10 px-4 pb-8 outline-none">
                <DrawerHeader className="px-0">
                  <DrawerTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Receive {chainLabel}</DrawerTitle>
                </DrawerHeader>
                {content}
              </DrawerContent>
            </Drawer>
          );
        }
        return (
          <Dialog open onOpenChange={(open) => !open && setQrTarget(null)}>
            <DialogContent className="max-w-sm bg-black border-white/10 p-6 rounded-3xl shadow-2xl outline-none border">
              <DialogHeader className="p-0 mb-4">
                <DialogTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Receive {chainLabel}</DialogTitle>
              </DialogHeader>
              {content}
            </DialogContent>
          </Dialog>
        );
      })()}

      {qrTarget && showSupportedTokens && (() => {
        const tokens = SUPPORTED_TOKENS[qrTarget.chain];
        const chainLabel = qrTarget.chain === "solana" ? "Solana" : "Base";
        const content = (
          <div className="space-y-3 py-2">
            {tokens.map((token) => (
              <div key={token.symbol} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <img src={token.icon} alt={token.symbol} className="w-9 h-9 rounded-xl object-contain bg-white/5 p-1" />
                <div>
                  <p className="text-sm font-bold text-white">{token.symbol}</p>
                  <p className="text-[11px] text-gray-500">{token.name}</p>
                </div>
              </div>
            ))}
          </div>
        );

        if (isMobile) {
          return (
            <Drawer open onOpenChange={(open) => !open && setShowSupportedTokens(false)}>
              <DrawerContent className="bg-black border-white/10 px-4 pb-8 outline-none">
                <DrawerHeader className="px-0">
                  <DrawerTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Supported on {chainLabel}</DrawerTitle>
                </DrawerHeader>
                {content}
              </DrawerContent>
            </Drawer>
          );
        }
        return (
          <Dialog open onOpenChange={(open) => !open && setShowSupportedTokens(false)}>
            <DialogContent className="max-w-sm bg-black border-white/10 p-6 rounded-3xl shadow-2xl outline-none border">
              <DialogHeader className="p-0 mb-4">
                <DialogTitle className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Supported on {chainLabel}</DialogTitle>
              </DialogHeader>
              {content}
            </DialogContent>
          </Dialog>
        );
      })()}
    </Tabs>
  );
}
