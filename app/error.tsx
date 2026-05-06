"use client";

import { useMemo } from "react";
import Image from "next/image";

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
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl border border-red-500/30 bg-zinc-950/80 rounded-2xl p-8">
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="Vantic" width={28} height={28} className="rounded-sm" />
          <span className="text-lg font-semibold tracking-wide">Vantic</span>
        </div>
        <p className="text-red-400 text-sm font-semibold tracking-wide">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">We hit an unexpected error</h1>
        <p className="mt-4 text-zinc-300 leading-relaxed">
          The app ran into a runtime issue. You can retry now, or contact support with the error details prefilled.
        </p>

        <div className="mt-6 rounded-lg border border-white/10 bg-black/40 p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Error Message</p>
          <p className="mt-2 text-sm text-zinc-200 break-all">{error?.message || "Unknown error"}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium"
          >
            Try Again
          </button>
          <a
            href={supportHref}
            className="px-4 py-2 rounded-lg border border-white/20 hover:border-white/40 text-white font-medium"
          >
            Contact Vantic Support
          </a>
        </div>
      </div>
    </main>
  );
}
