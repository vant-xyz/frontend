"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Fuel, ArrowDownLeft, TrendingUp, Globe, CheckCircle2, ArrowUpRight, Wallet } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = "vantic_tutorial_v1_seen";

interface Slide {
  tag: string;
  title: string;
  body: React.ReactNode;
  icon: React.ReactNode;
}

function SlideIcon({ children, color = "red" }: { children: React.ReactNode; color?: string }) {
  return (
    <div className={cn(
      "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
      color === "red" && "bg-red-600/15 border border-red-600/20",
      color === "blue" && "bg-blue-600/15 border border-blue-600/20",
      color === "green" && "bg-green-600/15 border border-green-600/20",
      color === "purple" && "bg-purple-600/15 border border-purple-600/20",
      color === "yellow" && "bg-yellow-600/15 border border-yellow-600/20",
      color === "white" && "bg-white/5 border border-white/10",
    )}>
      {children}
    </div>
  );
}

const slides: Slide[] = [
  {
    tag: "Welcome",
    title: "Welcome to Vantic",
    icon: (
      <SlideIcon color="red">
        <div className="w-7 h-7 bg-red-600 rounded-md shadow-lg shadow-red-600/30" />
      </SlideIcon>
    ),
    body: (
      <p className="text-gray-300 text-sm leading-relaxed">
        Vantic is the fastest binary prediction market terminal on Solana. Trade on crypto price predictions and real-world events, <b>Demo trading</b> is live now. This quick walkthrough gets you from zero to your first trade.
      </p>
    ),
  },
  {
    tag: "Balance",
    title: "Your Balance",
    icon: (
      <SlideIcon color="white">
        <Wallet size={26} className="text-gray-200" />
      </SlideIcon>
    ),
    body: (
      <p className="text-gray-300 text-sm leading-relaxed">
        Tap your <span className="text-white font-bold">balance widget</span> in the top-right corner of the screen to open your account overview. Funding, withdrawals, and asset tracking all live there.
      </p>
    ),
  },
  {
    tag: "Refill",
    title: "Funding via Refill",
    icon: (
      <SlideIcon color="blue">
        <Fuel size={26} className="text-blue-400" />
      </SlideIcon>
    ),
    body: (
      <p className="text-gray-300 text-sm leading-relaxed">
        The quickest way to start. Hit <span className="text-white font-bold">Refill</span> inside your balance, you'll receive up to <span className="text-white font-bold">$400 USD</span> in demo funds. Your Vantic Solana wallet and trading balance are topped up automatically.
      </p>
    ),
  },
  {
    tag: "External",
    title: "Funding via External Wallet",
    icon: (
      <SlideIcon color="white">
        <ArrowDownLeft size={26} className="text-gray-200" />
      </SlideIcon>
    ),
    body: (
      <p className="text-gray-300 text-sm leading-relaxed">
        Get devnet tokens in any Solana wallet such as Phantom, Solflare or Backpack and send them directly to your Vantic Solana address, found in <span className="text-white font-bold">Account → Wallets</span>. SOL and USDC are both supported.
      </p>
    ),
  },
  {
    tag: "Private",
    title: "Private Deposits",
    icon: (
      <SlideIcon color="blue">
        <img src="/media/images/umbra-icon.jpg" alt="Umbra" className="w-7 h-7 rounded-lg object-cover" />
      </SlideIcon>
    ),
    body: (
      <div className="space-y-3">
        <p className="text-gray-300 text-sm leading-relaxed">
          You can also fund privately. The on-chain link between your source wallet and your Vantic identity is completely broken.
        </p>
        <div className="flex items-center gap-2">
          <img src="/media/images/umbra-icon.jpg" alt="Umbra" className="w-4 h-4 rounded-full object-cover shrink-0" />
          <p className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">Powered by Umbra</p>
        </div>
        <p className="text-gray-500 text-xs">Follow the steps in the Private Deposit flow inside your balance.</p>
      </div>
    ),
  },
  {
    tag: "Crypto",
    title: "Crypto Price Prediction",
    icon: (
      <SlideIcon color="green">
        <TrendingUp size={26} className="text-green-400" />
      </SlideIcon>
    ),
    body: (
      <p className="text-gray-300 text-sm leading-relaxed">
        Go to the <span className="text-white font-bold">Crypto tab</span> and pick a market. The order form is on the right on desktop while on mobile, tap the <span className="text-white font-bold">Trade tab</span>. Vote <span className="text-green-400 font-bold">YES</span> if you think the price hits the target, <span className="text-red-400 font-bold">NO</span> if it doesn't.
      </p>
    ),
  },
  {
    tag: "General",
    title: "All Other Markets",
    icon: (
      <SlideIcon color="purple">
        <Globe size={26} className="text-purple-400" />
      </SlideIcon>
    ),
    body: (
      <p className="text-gray-300 text-sm leading-relaxed">
        The <span className="text-white font-bold">General tab</span> has every non-crypto market from sports, politics, world events. Pick a market, read the question, and place your conviction the same way.
      </p>
    ),
  },
  {
    tag: "Resolution",
    title: "When Markets Resolve",
    icon: (
      <SlideIcon color="green">
        <CheckCircle2 size={26} className="text-green-400" />
      </SlideIcon>
    ),
    body: (
      <p className="text-gray-300 text-sm leading-relaxed">
        When a market settles, your payout is credited automatically. Check your <span className="text-white font-bold">Balance</span> to see it reflected, or head to the <span className="text-white font-bold">History</span> screen to review your closed positions and PnL.
      </p>
    ),
  },
  {
    tag: "Withdraw",
    title: "Withdrawing Funds",
    icon: (
      <SlideIcon color="red">
        <ArrowUpRight size={26} className="text-red-400" />
      </SlideIcon>
    ),
    body: (
      <div className="space-y-3">
        <p className="text-gray-300 text-sm leading-relaxed">
          Open your balance and tap <span className="text-white font-bold">Withdraw</span>. Trading balance withdrawals land in your external wallet as USDC — private by default.
        </p>
        <div className="flex items-center gap-2">
          <img src="/media/images/magicblock-icon.jpg" alt="MagicBlock" className="w-4 h-4 rounded-full object-cover shrink-0" />
          <p className="text-[11px] text-green-400 font-bold uppercase tracking-wider">Private by default · MagicBlock</p>
        </div>
        <p className="text-gray-400 text-sm font-semibold">Good luck and happy predicting.</p>
      </div>
    ),
  },
];

export function TutorialModal() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, []);

  const isLast = current === slides.length - 1;

  const dismiss = () => {
    if (dontShow || isLast) localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const inner = (
    <div className="flex flex-col">
      {/* Slide content */}
      <div className={cn("flex flex-col gap-5 px-6 pt-6 pb-4 overflow-y-auto", isMobile && "flex-1")}>
        <div className="flex items-start gap-4">
          {slides[current].icon}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">
              Step {current + 1} of {slides.length} · {slides[current].tag}
            </p>
            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight">
              {slides[current].title}
            </h2>
          </div>
        </div>
        <div>{slides[current].body}</div>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-1.5 py-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "rounded-full transition-all",
              i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
            )}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 px-6 pb-6">
        <div className="flex items-center gap-2">
          <Checkbox
            id="dont-show"
            checked={dontShow}
            onCheckedChange={(v) => setDontShow(Boolean(v))}
            className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
          />
          <Label htmlFor="dont-show" className="text-[10px] text-gray-500 font-bold uppercase tracking-widest cursor-pointer">
            Don't show again
          </Label>
        </div>

        <div className="flex items-center gap-2">
          {current > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrent(current - 1)}
              className="h-9 w-9 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft size={16} />
            </Button>
          )}
          {isLast ? (
            <Button
              onClick={finish}
              className="h-9 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest"
            >
              Let's go
            </Button>
          ) : (
            <Button
              onClick={() => setCurrent(current + 1)}
              className="h-9 px-5 rounded-xl bg-white text-black hover:bg-gray-200 font-black text-[10px] uppercase tracking-widest gap-1.5 shadow-none"
            >
              Next <ArrowRight size={13} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={dismiss}>
        <DrawerContent className="bg-black border-white/10 outline-none max-h-[85vh]">
          {inner}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={dismiss}>
      <DialogContent className="max-w-sm bg-black border-white/10 p-0 rounded-3xl shadow-2xl outline-none overflow-hidden">
        <div className="max-h-[85vh] flex flex-col">
          {inner}
        </div>
      </DialogContent>
    </Dialog>
  );
}
