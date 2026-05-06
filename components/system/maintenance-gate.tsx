"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function MaintenanceGate({ children }: Props) {
  const pathname = usePathname();
  const isMaintenance = process.env.NEXT_PUBLIC_IS_MAINTENANCE === "true";
  const isLanding = pathname === "/";

  if (!isMaintenance || isLanding) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl relative rounded-2xl">
        <div className="pointer-events-none absolute -inset-1 rounded-2xl border border-red-500/50 animate-[maintenanceOrbit_3s_linear_infinite]" />
        <div className="relative border border-white/15 bg-zinc-950/80 rounded-2xl p-8">
          <div className="flex items-center justify-center gap-3">
            <Image src="/icon.png" alt="Vantic" width={28} height={28} className="rounded-sm" />
            <span className="text-lg font-semibold tracking-wide">Vantic</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-center">Scheduled Maintenance</h1>
          <p className="mt-4 text-zinc-300 leading-relaxed text-center">
            Vantic is temporarily unavailable while we upgrade core systems.
            Please check back shortly.
          </p>
          <p className="mt-4 text-sm text-zinc-500 text-center">Status: maintenance mode</p>

          <div className="mt-8 space-y-3">
            <details className="group border border-white/10 rounded-lg bg-black/30 px-4 py-3">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                What’s happening right now?
                <span className="text-zinc-500 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-zinc-300">
                We are applying infrastructure upgrades to improve stability, order throughput, and recovery times.
              </p>
            </details>
            <details className="group border border-white/10 rounded-lg bg-black/30 px-4 py-3">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                Will my funds or balances be affected?
                <span className="text-zinc-500 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-zinc-300">
                No. Account and balance data remain preserved. This maintenance is focused on availability and performance.
              </p>
            </details>
            <details className="group border border-white/10 rounded-lg bg-black/30 px-4 py-3">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                When will trading resume?
                <span className="text-zinc-500 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-zinc-300">
                Trading resumes as soon as post-maintenance checks pass. Please refresh this page periodically.
              </p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
