"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function buildSupportHref(error: Error & { digest?: string }) {
  const subject = "Downtime Report";
  const body = [
    "Hi Vantic Support,",
    "",
    "I hit an app error while using Vantic.",
    "",
    `Message: ${error?.message || "Unknown error"}`,
    `Digest: ${error?.digest || "N/A"}`,
    `Time: ${new Date().toISOString()}`,
    "",
    "Please investigate.",
  ].join("\n");
  return `mailto:support@vantic.xyz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const supportHref = useMemo(() => buildSupportHref(error), [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2.5 mb-16">
        <Image src="/icon.png" alt="Vantic" width={20} height={20} className="rounded-sm opacity-60" />
        <span className="text-[10px] font-black tracking-[0.35em] uppercase text-gray-600">Vantic</span>
      </div>

      <div className="w-full max-w-sm">
        <p className="text-[9px] font-black tracking-[0.35em] uppercase text-red-500/80 mb-5 text-center">
          Runtime Error
        </p>

        {/* Status row */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-red-400">System fault detected</span>
        </div>

        <h1 className="text-lg font-black uppercase tracking-tight text-white mb-2 text-center">
          Something broke
        </h1>
        <p className="text-xs text-gray-500 leading-relaxed mb-8 text-center">
          An unexpected error occurred. Hit retry or send the report to support — the details are prefilled.
        </p>

        {/* Error block */}
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 mb-6 font-mono">
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Error</p>
          <p className="text-xs text-red-300 break-all leading-relaxed">
            {error?.message || "Unknown runtime error"}
          </p>
          {error?.digest && (
            <p className="text-[9px] text-gray-700 mt-2">digest: {error.digest}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
          >
            Retry
          </button>
          <a
            href={supportHref}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/8 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-center"
          >
            Report
          </a>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
