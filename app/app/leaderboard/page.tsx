"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getLeaderboard, getMyLeaderboardRank, LeaderboardEntry } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReelAnimation } from "@/components/landing/reel-animation";
import { HelpCircle, LocateFixed, Share2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

type Period = "today" | "7d" | "all";

const PAGE_SIZE = 10;

const BANNER_TEXTS = [
  "Trade and climb the leaderboard",
  "Every trade moves your rank",
  "Top traders earn the most glory",
  "Who is #1 today?",
];

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  "7d": "7 Days",
  all: "All Time",
};

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: "force-cache" });
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function Avatar({
  url,
  name,
  size = 36,
}: {
  url?: string | null;
  name: string;
  size?: number;
}) {
  const initials = name?.[0]?.toUpperCase() ?? "?";
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-white/10 flex items-center justify-center font-bold text-white shrink-0"
    >
      {initials}
    </div>
  );
}

const RANK_COLORS = ["text-yellow-400", "text-gray-300", "text-orange-400"];
const MEDAL = ["🥇", "🥈", "🥉"];

function RankRow({
  entry,
  highlight,
  innerRef,
  onShare,
}: {
  entry: LeaderboardEntry;
  highlight?: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
  onShare?: () => void;
}) {
  const rankColor = entry.rank > 0 && entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : "text-gray-500";
  const rankLabel =
    entry.rank <= 0
      ? "?"
      : entry.rank <= 3
      ? MEDAL[entry.rank - 1]
      : `#${fmt(entry.rank)}`;

  return (
    <div
      ref={innerRef}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border transition scroll-mt-4",
        highlight
          ? "border-white/20 bg-white/10"
          : "border-white/5 bg-white/[0.02] hover:bg-white/5"
      )}
    >
      <span className={cn("w-8 text-center text-xs font-mono shrink-0", rankColor)}>
        {rankLabel}
      </span>
      <Avatar url={entry.profile_image_url} name={entry.username} size={32} />
      <span className="flex-1 text-sm font-medium text-white truncate">
        {entry.username}
      </span>
      <div className="flex items-center gap-3 text-right shrink-0">
        <div className="hidden sm:block">
          <p className="text-xs text-gray-500">PnL</p>
          <p className={cn("text-xs font-semibold", entry.pnl >= 0 ? "text-green-400" : "text-red-400")}>
            {entry.pnl >= 0 ? "+" : "-"}${fmt(Math.abs(entry.pnl), 2)}
          </p>
        </div>
        <div className="hidden sm:block">
          <p className="text-xs text-gray-500">Trades</p>
          <p className="text-xs font-semibold text-white">{fmt(entry.trades)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">VP</p>
          <p className="text-xs font-semibold text-primary">{fmt(entry.vantic_points ?? 0)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">AS</p>
          <p className="text-xs font-semibold text-accent">{fmt(entry.activity_score ?? 0, 1)}</p>
        </div>
        {onShare && (
          <button
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
          >
            <Share2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

interface CardImages {
  banner: string;
  logo: string;
  avatar: string | null;
}

function ShareCard({
  entry,
  cardRef,
  images,
}: {
  entry: LeaderboardEntry;
  cardRef: React.Ref<HTMLDivElement>;
  images: CardImages | null;
}) {
  const rankLabel =
    entry.rank <= 0 ? "?" : entry.rank <= 3 ? `${MEDAL[entry.rank - 1]} #${entry.rank}` : `#${fmt(entry.rank)}`;

  return (
    <div ref={cardRef} className="relative overflow-hidden rounded-2xl">
      <img
        src={images?.banner ?? "/media/images/banners/banner2.png"}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.35 }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.7) 100%)" }}
      />

      <div className="relative p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <img src={images?.logo ?? "/icon.png"} alt="Vantic" className="w-5 h-5" />
          <span className="text-xs font-bold text-white tracking-widest uppercase">Vantic</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              url={images?.avatar ?? entry.profile_image_url}
              name={entry.username}
              size={52}
            />
            <div>
              <p className="text-base font-bold text-white leading-tight">{entry.username}</p>
            </div>
          </div>
          <span className="text-4xl font-black text-white tabular-nums shrink-0">
            {rankLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <p className="text-xs text-gray-400">PnL</p>
            <p className={cn("text-xl font-bold", entry.pnl >= 0 ? "text-green-400" : "text-red-400")}>
              {entry.pnl >= 0 ? "+" : "-"}${fmt(Math.abs(entry.pnl), 2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Trades</p>
            <p className="text-xl font-bold text-white">{fmt(entry.trades)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">VP</p>
            <p className="text-xl font-bold text-primary">{fmt(entry.vantic_points ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">AS</p>
            <p className="text-xl font-bold text-accent">{fmt(entry.activity_score ?? 0, 1)}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-right">vantic.xyz</p>
      </div>
    </div>
  );
}

function SharePanel({
  entry,
  onClose,
}: {
  entry: LeaderboardEntry | null;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [images, setImages] = useState<CardImages | null>(null);

  useEffect(() => {
    if (!entry) return;
    setImages(null);
    Promise.all([
      toDataUrl("/media/images/banners/banner2.png"),
      toDataUrl("/icon.png"),
      entry.profile_image_url
        ? toDataUrl(entry.profile_image_url).catch(() => null)
        : Promise.resolve(null),
    ]).then(([banner, logo, avatar]) => {
      setImages({ banner, logo, avatar });
    }).catch(() => {
      setImages({ banner: "/media/images/banners/banner2.png", logo: "/icon.png", avatar: null });
    });
  }, [entry?.profile_image_url]);

  async function handleDownload() {
    if (!cardRef.current || !images) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: false,
        pixelRatio: 2,
        skipFonts: false,
      });
      const link = document.createElement("a");
      link.download = `vantic-rank-${entry?.rank ?? "me"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // silent
    } finally {
      setDownloading(false);
    }
  }

  const content = entry ? (
    <div className="space-y-4 pt-2">
      <ShareCard entry={entry} cardRef={cardRef} images={images} />
      <button
        onClick={handleDownload}
        disabled={downloading || !images}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold text-white transition-colors disabled:opacity-50"
      >
        <Download size={14} />
        {downloading ? "Generating..." : !images ? "Loading..." : "Download"}
      </button>
    </div>
  ) : null;

  if (isMobile) {
    return (
      <Drawer open={!!entry} onOpenChange={onClose}>
        <DrawerContent className="bg-background border-white/10 max-h-[90vh]">
          <DrawerHeader className="border-b border-white/5 pb-3">
            <DrawerTitle className="text-base font-bold text-white text-left">
              Share rank
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-4 pb-8">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={!!entry} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-background border-white/10 w-[calc(100%-32px)]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-bold text-white">Share rank</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

function VPContent() {
  return (
    <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
      <p>
        Vantic Points are the core reputation currency on Vantic. You earn them
        by taking real actions on the platform. They never reset and accumulate
        permanently over your lifetime on the platform.
      </p>
      <p>
        Unlike leaderboard scores that can fluctuate, VP is an absolute number
        that only ever grows (or decreases slightly from losing trades). It
        reflects your history of participation, risk-taking, and engagement.
      </p>
      <div className="space-y-2">
        <p className="text-xs font-bold text-white uppercase tracking-wider">
          How you earn VP
        </p>
        <div className="divide-y divide-white/5 rounded-xl border border-white/5 overflow-hidden">
          {[
            ["Execute a trade", "+5"],
            ["Win a prediction market trade", "+20"],
            ["Lose a prediction market trade", "-20"],
            ["Create a VS event", "+150"],
            ["Join a VS event", "+125"],
            ["Win a VS event", "+200"],
            ["Lose a VS event", "+100"],
            ["Deposit funds", "Scales with amount"],
            ["Withdraw funds", "Scales with amount"],
            ["Sell an asset", "Scales with amount"],
          ].map(([action, pts]) => (
            <div
              key={action}
              className="flex items-center justify-between px-3 py-2 bg-white/[0.02]"
            >
              <span className="text-xs text-gray-300">{action}</span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  pts.startsWith("+")
                    ? "text-primary"
                    : pts.startsWith("-")
                    ? "text-red-400"
                    : "text-accent"
                )}
              >
                {pts}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
        <p className="text-xs font-bold text-white">Amount-based scaling</p>
        <p className="text-xs text-gray-400">
          Deposits, withdrawals, and asset sales use exponential formulas that
          reward larger amounts. A $10 deposit earns more than ten $1 deposits.
          Asset sales grow the fastest per dollar, then withdrawals, then
          deposits.
        </p>
      </div>
      <p className="text-xs text-gray-500">
        Your final leaderboard rank is VP + Activity Score. Even a user with
        modest VP can outrank someone with high VP if their Activity Score is
        significantly higher.
      </p>
    </div>
  );
}

function ASContent() {
  return (
    <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
      <p>
        Activity Score measures how active you are relative to every other
        trader on Vantic. It is a percentile-based composite that is recomputed
        daily and sits on a 0 to 100 scale.
      </p>
      <p>
        A score of 80 means you are more active than 80% of all ranked users
        across the four dimensions below. A score of 100 is only achievable by
        the single most active user across all four dimensions simultaneously.
      </p>
      <div className="space-y-2">
        <p className="text-xs font-bold text-white uppercase tracking-wider">
          The four dimensions
        </p>
        <div className="divide-y divide-white/5 rounded-xl border border-white/5 overflow-hidden">
          {[
            [
              "Profit and Loss",
              "25%",
              "Your total realized PnL from settled prediction markets. Higher PnL pushes your percentile up.",
            ],
            [
              "Trade count",
              "25%",
              "Total number of prediction market positions you have opened. More trades means a higher rank on this dimension.",
            ],
            [
              "Total deposits",
              "25%",
              "Cumulative USD deposited into Vantic across all time. Larger and more frequent deposits improve this score.",
            ],
            [
              "Total withdrawals",
              "25%",
              "Cumulative USD withdrawn from Vantic. This rewards users who actively move funds rather than sitting idle.",
            ],
          ].map(([dim, weight, desc]) => (
            <div key={dim} className="px-3 py-2.5 bg-white/[0.02] space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{dim}</span>
                <span className="text-xs font-bold text-accent">{weight}</span>
              </div>
              <p className="text-[11px] text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
        <p className="text-xs font-bold text-white">How it is calculated</p>
        <p className="text-xs text-gray-400">
          Each dimension is ranked using PERCENT_RANK across all users with a
          username. The four percentiles are averaged with equal weight and
          multiplied by 100. So if your PnL is in the 60th percentile, your
          trade count in the 80th, deposits in the 50th, and withdrawals in the
          70th, your AS is (0.60 + 0.80 + 0.50 + 0.70) / 4 * 100 = 65.
        </p>
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
        <p className="text-xs font-bold text-white">AS vs VP</p>
        <p className="text-xs text-gray-400">
          AS resets relative to the rest of the community every day. If other
          users become more active, your AS can drop even without doing
          anything. VP never resets. Together they reward both consistent
          platform engagement (AS) and raw lifetime participation (VP).
        </p>
      </div>
    </div>
  );
}

function InfoPanel({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent className="bg-background border-white/10 max-h-[85vh]">
          <DrawerHeader className="border-b border-white/5 pb-3">
            <DrawerTitle className="text-base font-bold text-white text-left">
              {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-4 pb-8">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-background border-white/10 w-[calc(100%-32px)] flex flex-col max-h-[80vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-bold text-white">{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto pr-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("today");
  const [page, setPage] = useState(1);
  const [pendingScrollToMe, setPendingScrollToMe] = useState(false);
  const [vpOpen, setVpOpen] = useState(false);
  const [asOpen, setAsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const myRowRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const [listResult, rankResult] = await Promise.allSettled([
        getLeaderboard(50, p),
        token ? getMyLeaderboardRank(token) : Promise.reject(),
      ]);

      const list =
        listResult.status === "fulfilled" ? listResult.value.entries ?? [] : [];
      setEntries(list);

      if (rankResult.status === "fulfilled" && rankResult.value.entry) {
        const rawEntry = rankResult.value.entry;
        const inList = list.find((e) => e.email === rawEntry.email);
        setMyEntry(inList ?? rawEntry);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    load(period);
  }, [load, period]);

  useEffect(() => {
    if (pendingScrollToMe) {
      setPendingScrollToMe(false);
      requestAnimationFrame(() => {
        myRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [page, pendingScrollToMe]);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pageEntries = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const myIndexInList = myEntry
    ? entries.findIndex((e) => e.email === myEntry.email)
    : -1;
  const myPageInList = myIndexInList >= 0
    ? Math.floor(myIndexInList / PAGE_SIZE) + 1
    : null;
  const myIsOnCurrentPage = myPageInList === page;
  const myIsPinned = myEntry !== null && myIndexInList < 0;

  function findMe() {
    if (!myEntry) return;
    if (myPageInList !== null && !myIsOnCurrentPage) {
      setPage(myPageInList);
      setPendingScrollToMe(true);
    } else {
      myRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <DashboardClient>
      <div className="space-y-6 pb-20">
        <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 px-6 py-8">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "url('/media/images/banners/banner2.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.28,
            }}
          />
          <div className="relative">
            <h1 className="text-2xl font-bold text-white mb-1">Leaderboard</h1>
            <p className="text-sm font-medium text-white">
              <ReelAnimation
                texts={BANNER_TEXTS}
                rotateInterval={3000}
                animateOnHover={false}
              />
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setVpOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
              >
                <span className="text-xs font-bold text-primary">VP</span>
                <HelpCircle size={11} className="text-gray-400" />
              </button>
              <button
                onClick={() => setAsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
              >
                <span className="text-xs font-bold text-accent">AS</span>
                <HelpCircle size={11} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <InfoPanel open={vpOpen} onClose={() => setVpOpen(false)} title="Vantic Points (VP)">
          <VPContent />
        </InfoPanel>
        <InfoPanel open={asOpen} onClose={() => setAsOpen(false)} title="Activity Score (AS)">
          <ASContent />
        </InfoPanel>
        <SharePanel
          entry={shareOpen && myEntry ? myEntry : null}
          onClose={() => setShareOpen(false)}
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
            {(["today", "7d", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  period === p
                    ? "bg-white/15 text-white"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          {myEntry && (
            <button
              onClick={findMe}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 transition-colors"
            >
              <LocateFixed size={13} className="text-white" />
              <span className="text-xs font-semibold text-white">Find me</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-xl" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-gray-500 text-sm py-12 text-center">
            No rankings yet. Start trading to appear here.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {pageEntries.map((e) => {
                const isMe = myEntry?.email === e.email;
                return (
                  <RankRow
                    key={e.rank}
                    entry={e}
                    highlight={isMe}
                    innerRef={isMe ? myRowRef : undefined}
                    onShare={isMe ? () => setShareOpen(true) : undefined}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-gray-500 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Pinned: user not in top 50 */}
            {myIsPinned && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 px-1">Your rank</p>
                <RankRow
                  entry={myEntry!}
                  highlight
                  innerRef={myRowRef}
                  onShare={() => setShareOpen(true)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardClient>
  );
}
