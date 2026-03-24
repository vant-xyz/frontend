"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditsModal } from "./credits-modal";

export function FooterSection() {
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  const footerLinks = [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "Contact Us", href: "mailto:me@davidnzube.xyz" },
  ];

  return (
    <>
      <footer className="relative border-t border-red-900/30 bg-black overflow-hidden">
        {/* Faded VANTIC text background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none overflow-hidden">
          <span className="text-9xl font-bold text-red-600 whitespace-nowrap select-none">VANTIC VANTIC VANTIC</span>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          {/* Main Footer */}
          <div className="py-16 lg:py-20">
            <div className="grid md:grid-cols-3 gap-12">
              {/* Brand Column */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-red-600 rounded"></div>
                  <span className="text-2xl font-bold text-white">Vantic</span>
                </div>

                <p className="text-gray-400 leading-relaxed mb-8 max-w-xs">
                  The fastest prediction market terminal for opinions. Trade crypto, sports, and custom wagers on the fastest execution engine.
                </p>

                {/* Social Links */}
                <div className="flex gap-4">
                  <a
                    href="https://x.com/vanticxyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="X (Twitter)"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Empty column for spacing on desktop */}
              <div />

              {/* Links Column */}
              <div className="space-y-4">
                {footerLinks.map((link) => (
                  link.href.startsWith("mailto") ? (
                    <a
                      key={link.name}
                      href={link.href}
                      className="block text-gray-400 hover:text-red-500 transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="block text-gray-400 hover:text-red-500 transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  )
                ))}
                <button
                  onClick={() => setIsCreditsOpen(true)}
                  className="block text-gray-400 hover:text-red-500 transition-colors text-sm cursor-pointer"
                >
                  Credits
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="py-6 border-t border-red-900/30 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>
              2025 Vantic. All rights reserved.
            </p>

            <p>
              Built for speedy execution.
            </p>
          </div>
        </div>
      </footer>

      <CreditsModal isOpen={isCreditsOpen} onClose={() => setIsCreditsOpen(false)} />
    </>
  );
}
