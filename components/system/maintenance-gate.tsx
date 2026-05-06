"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = { children: ReactNode };

const FAQS = [
  {
    q: "What's happening right now?",
    a: "We're applying infrastructure upgrades to improve stability, order throughput, and settlement speed.",
  },
  {
    q: "Will my funds or balances be affected?",
    a: "No. Account and balance data are fully preserved. This maintenance covers availability only.",
  },
  {
    q: "When will trading resume?",
    a: "Trading resumes as soon as post-maintenance checks pass. Refresh this page periodically.",
  },
];

export function MaintenanceGate({ children }: Props) {
  const pathname = usePathname();
  const isMaintenance = process.env.NEXT_PUBLIC_IS_MAINTENANCE === "true";
  const isLanding = pathname === "/";

  if (!isMaintenance || isLanding) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-16">
        <Image src="/icon.png" alt="Vantic" width={20} height={20} className="rounded-sm opacity-60" />
        <span className="text-[10px] font-black tracking-[0.35em] uppercase text-gray-600">Vantic</span>
      </div>

      <div className="w-full max-w-sm">
        {/* Status badge */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
            Maintenance in progress
          </span>
        </div>

        <h1 className="text-xl font-black uppercase tracking-tight text-white text-center mb-3">
          We'll be right back
        </h1>
        <p className="text-xs text-gray-500 leading-relaxed text-center mb-10">
          Vantic is temporarily offline for scheduled maintenance. Your funds and positions are safe.
        </p>

        {/* System status cards */}
        <div className="grid grid-cols-3 gap-2 mb-10">
          {[
            { label: "Funds", status: "safe", color: "text-green-400 bg-green-500/10 border-green-500/20" },
            { label: "Markets", status: "paused", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
            { label: "Orders", status: "paused", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
          ].map(({ label, status, color }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
              <p className="text-[10px] font-black uppercase tracking-wide">{status}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="space-y-2">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group border border-white/8 rounded-xl bg-white/[0.02] px-4 py-3">
              <summary className="cursor-pointer list-none text-xs font-bold flex items-center justify-between gap-3 text-gray-300 select-none">
                <span>{q}</span>
                <span className="text-gray-600 shrink-0 group-open:rotate-45 transition-transform duration-200 text-base leading-none">+</span>
              </summary>
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>

        <p className="mt-10 text-center text-[9px] font-bold uppercase tracking-widest text-gray-700">
          support@vantic.xyz
        </p>
      </div>
    </div>
  );
}
