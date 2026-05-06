"use client";

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
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl border border-white/15 bg-zinc-950/80 rounded-2xl p-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Scheduled Maintenance</h1>
        <p className="mt-4 text-zinc-300 leading-relaxed">
          Vantic is temporarily unavailable while we upgrade core systems.
          Please check back shortly.
        </p>
        <p className="mt-6 text-sm text-zinc-500">Status: maintenance mode</p>
      </div>
    </main>
  );
}

