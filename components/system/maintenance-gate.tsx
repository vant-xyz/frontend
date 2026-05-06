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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
      <div className="flex items-center gap-2.5 mb-16">
        <Image src="/icon.png" alt="Vantic" width={22} height={22} className="rounded-sm" />
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500">Vantic</span>
      </div>

      <div className="w-full max-w-sm">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-yellow-500 mb-6">
          Maintenance
        </p>

        <h1 className="text-2xl font-black text-white mb-2">We'll be right back</h1>
        <p className="text-xs text-gray-500 leading-relaxed mb-10">
          Vantic is temporarily offline for scheduled maintenance. Your funds and positions are safe.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-10">
          {[
            { label: "Funds", status: "Safe", cls: "text-green-400 border-green-500/20" },
            { label: "Markets", status: "Paused", cls: "text-yellow-400 border-yellow-500/20" },
            { label: "Orders", status: "Paused", cls: "text-yellow-400 border-yellow-500/20" },
          ].map(({ label, status, cls }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${cls}`}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1">{label}</p>
              <p className="text-[10px] font-black uppercase tracking-wide">{status}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group border border-white/10 rounded-xl px-4 py-3">
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
