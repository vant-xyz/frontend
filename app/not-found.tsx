import Link from "next/link";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2.5 mb-16">
        <Image src="/icon.png" alt="Vantic" width={20} height={20} className="rounded-sm opacity-60" />
        <span className="text-[10px] font-black tracking-[0.35em] uppercase text-gray-600">Vantic</span>
      </div>

      <div className="text-center max-w-xs">
        <p className="text-[9px] font-black tracking-[0.35em] uppercase text-red-500/80 mb-6">
          Error 404
        </p>

        <div
          className="text-[96px] font-black leading-none text-white mb-8 select-none"
          style={{ textShadow: "0 0 48px rgba(220,38,38,0.35), 0 0 96px rgba(220,38,38,0.1)" }}
        >
          404
        </div>

        <h1 className="text-base font-black uppercase tracking-widest text-white mb-3">
          Page not found
        </h1>
        <p className="text-xs text-gray-500 leading-relaxed mb-10">
          This page was delisted, moved, or never existed. Even our prediction engine couldn't see this one coming.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/app/general"
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-center"
          >
            Markets
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/8 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-center"
          >
            Home
          </Link>
        </div>
      </div>

      <div className="mt-16 flex gap-6">
        {[
          { label: "Explorer", href: "/explorer" },
          { label: "Privacy", href: "/privacy-policy" },
          { label: "Terms", href: "/terms-of-service" },
        ].map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
