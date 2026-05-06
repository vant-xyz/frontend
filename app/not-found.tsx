import Link from "next/link";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2.5 mb-16">
        <Image src="/icon.png" alt="Vantic" width={22} height={22} className="rounded-sm" />
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500">Vantic</span>
      </div>

      <div className="w-full max-w-xs text-center">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-red-500 mb-3">
          Error 404
        </p>
        <h1 className="text-7xl font-black text-white mb-6">404</h1>
        <p className="text-sm font-bold text-white mb-2">Page not found</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-10">
          This page was moved, deleted, or never existed.
        </p>

        <div className="flex gap-3">
          <Link
            href="/app/general"
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors text-center"
          >
            Markets
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors text-center"
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
            className="text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:text-gray-400 transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
