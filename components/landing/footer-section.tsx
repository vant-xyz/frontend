"use client";

export function FooterSection() {
  const socialLinks = [
    { name: "X (Twitter)", href: "#" },
  ];

  const footerLinks = [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Contact Us", href: "mailto:me@davidnzube.xyz" },
  ];

  return (
    <footer className="relative border-t border-red-900/30 bg-black overflow-hidden">
      {/* Faded VANT text background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none overflow-hidden">
        <span className="text-9xl font-bold text-red-600 whitespace-nowrap select-none">VANT VANT VANT</span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-16 lg:py-20">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Brand Column */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-red-600 rounded"></div>
                <span className="text-2xl font-bold text-white">VANT</span>
              </div>

              <p className="text-gray-400 leading-relaxed mb-8 max-w-xs">
                The fastest prediction market terminal for West Africa. Trade crypto, sports, and custom wagers on Solana.
              </p>

              {/* Social Links */}
              <div className="flex gap-6">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Empty column for spacing on desktop */}
            <div />

            {/* Links Column */}
            <div className="space-y-4">
              {footerLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-gray-400 hover:text-red-500 transition-colors text-sm"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-red-900/30 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>
            2025 VANT. All rights reserved.
          </p>

          <p>
            Built for the Nigerian market. Made on Solana.
          </p>
        </div>
      </div>
    </footer>
  );
}
