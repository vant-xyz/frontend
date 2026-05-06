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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2.5 mb-16">
        <Image src="/icon.png" alt="Vantic" width={22} height={22} className="rounded-sm" />
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500">Vantic</span>
      </div>

      <div className="w-full max-w-sm">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-red-500 mb-6">
          Runtime Error
        </p>

        <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
        <p className="text-xs text-gray-500 leading-relaxed mb-8">
          An unexpected error occurred. Retry or send the prefilled report to support.
        </p>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-6 font-mono">
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Error</p>
          <p className="text-xs text-gray-300 break-all leading-relaxed">
            {error?.message || "Unknown error"}
          </p>
          {error?.digest && (
            <p className="text-[9px] text-gray-700 mt-2">digest: {error.digest}</p>
          )}
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={reset}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
          >
            Retry
          </button>
          <a
            href={supportHref}
            className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors text-center"
          >
            Report
          </a>
        </div>

        <Link
          href="/"
          className="block text-center text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:text-gray-400 transition-colors"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
