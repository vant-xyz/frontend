"use client";

import { useEffect, useRef, useState } from "react";

function Ico({ src, size = 22, rounded = false }: { src: string; size?: number; rounded?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`inline-block align-[-0.18em] mr-1.5${rounded ? " rounded-full" : ""}`}
      style={{ width: size, height: size }}
    />
  );
}

const USDC = () => <Ico src="/media/images/token_icons/usdc.png" size={16} rounded />;

// Bottom-left logos that blur-in when the card becomes active
function CardLogos({ srcs, active }: { srcs: string[]; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {srcs.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          className="w-7 h-7 rounded-[6px] object-cover"
          style={{
            opacity: active ? 1 : 0,
            filter: active ? "blur(0px)" : "blur(8px)",
            transform: active ? "scale(1)" : "scale(0.85)",
            transition: `opacity 0.45s ease ${0.1 + i * 0.08}s, filter 0.45s ease ${0.1 + i * 0.08}s, transform 0.45s ease ${0.1 + i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

const steps = [
  {
    n: "01",
    label: "Connect Your Wallet",
    title: (
      <>
        Connect Your <Ico src="/icons8-wallet-96.png" />Wallet
      </>
    ),
    body: (
      <>
        Link any Solana wallet. Phantom, Backpack, or Solflare. No email, no
        account. One signature proves who you are.
      </>
    ),
    tag: "non-custodial",
    logos: ["/phantom_logo.jpeg", "/solflare_logo.jpeg"],
  },
  {
    n: "02",
    label: "Browse Live Markets",
    title: (
      <>
        <Ico src="/icons8-search-96.png" />Browse Live Markets
      </>
    ),
    body: (
      <>
        World Cup matches, crypto outcomes, and politics. Powered by Jupiter
        Predict and updated in real time.
      </>
    ),
    tag: "powered by Jupiter",
    logos: ["/jupiter-logo.png", "/kalshi-logo.jpeg"],
  },
  {
    n: "03",
    label: "Place Your Prediction",
    title: (
      <>
        Place Your <Ico src="/icons8-select-96.png" />Prediction
      </>
    ),
    body: (
      <>
        Pick YES or NO, enter your <USDC />USDC, review the fee breakdown, then
        sign in your wallet.
      </>
    ),
    tag: "0.5% fee, flat",
    logos: [],
  },
  {
    n: "04",
    label: "Collect Your Winnings",
    title: (
      <>
        Collect Your <Ico src="/icons8-money-96.png" />Winnings
      </>
    ),
    body: (
      <>
        When the event resolves, claim on-chain. Instant <USDC />USDC payout.
        The contract holds the funds the whole way, never us.
      </>
    ),
    tag: "instant on-chain",
    logos: [],
  },
];

export function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      setProgress(p);
    };

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const headIn = progress > 0.02;
  const n = steps.length;
  const cardStart = 0.12;
  const cardEnd = 0.92;
  let activeCard = -1;
  if (progress >= cardStart) {
    activeCard = Math.min(n - 1, Math.floor(((progress - cardStart) / (cardEnd - cardStart)) * n));
  }
  if (progress >= cardEnd) activeCard = n - 1;

  return (
    <section
      id="how-it-works"
      ref={ref}
      style={{ height: `${(n + 1) * 100}vh` }}
      className="relative bg-[#0a0404]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-start lg:items-center pt-28 pb-12 lg:py-0">
        {/* ambient glow */}
        <div className="pointer-events-none absolute top-1/2 left-[20%] -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-red-900/10 blur-[120px]" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid lg:grid-cols-[40%_60%] gap-8 lg:gap-16 items-center">

          {/* LEFT — pinned heading */}
          <div
            className="transition-all duration-700"
            style={{
              opacity: headIn ? 1 : 0,
              filter: headIn ? "blur(0)" : "blur(12px)",
              transform: headIn ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
              How It Works
            </h2>
            <p className="text-zinc-500 text-base leading-relaxed max-w-xs">
              Four steps from zero to an on-chain prediction.
            </p>

            {/* progress rail */}
            <div className="mt-10 flex flex-col gap-3">
              {steps.map((s, i) => (
                <button
                  key={s.n}
                  type="button"
                  className="group flex items-center gap-3 text-left"
                >
                  <span
                    className="h-px rounded-full transition-all duration-500"
                    style={{
                      width: i === activeCard ? 40 : 18,
                      backgroundColor: i <= activeCard ? "#dc2626" : "rgba(255,255,255,0.12)",
                    }}
                  />
                  <span
                    className="text-xs font-medium tabular-nums transition-colors duration-300"
                    style={{ color: i === activeCard ? "#fff" : i < activeCard ? "#71717a" : "#3f3f46" }}
                  >
                    {s.n} · {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — stacked cards */}
          <div className="relative h-[300px] sm:h-[280px]">
            {steps.map((step, i) => {
              const active = i === activeCard;
              const past = i < activeCard;
              return (
                <article
                  key={step.n}
                  className="absolute inset-0 rounded-[16px] p-8 transition-all duration-500 glass-card flex flex-col"
                  style={{
                    opacity: active ? 1 : 0,
                    filter: active ? "blur(0)" : "blur(14px)",
                    transform: active
                      ? "translateY(0) scale(1)"
                      : past
                      ? "translateY(-28px) scale(0.97)"
                      : "translateY(28px) scale(0.97)",
                    pointerEvents: active ? "auto" : "none",
                  }}
                >
                  <span className="block text-[44px] font-black leading-none text-white/[0.06] mb-4 select-none">
                    {step.n}
                  </span>
                  <h3 className="text-2xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-auto">{step.body}</p>

                  {/* Bottom row: badge left, logos right */}
                  <div className="flex items-center justify-between mt-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-[8px] bg-red-950/40 border border-red-900/30 text-red-400 text-xs font-medium">
                      {step.tag}
                    </span>
                    {step.logos.length > 0 && (
                      <CardLogos srcs={step.logos} active={active} />
                    )}
                  </div>
                </article>
              );
            })}

            {activeCard === -1 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-zinc-700 text-sm animate-pulse">Keep scrolling ↓</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
