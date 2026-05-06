"use client";

import { useMemo } from "react";
import Image from "next/image";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function buildSupportHref(error: Error & { digest?: string }) {
  const subject = "Downtime Report";
  const body = [
    "Hi Vantic Support,",
    "",
    "I hit a critical global error while using Vantic.",
    "",
    `Message: ${error?.message || "Unknown error"}`,
    `Digest: ${error?.digest || "N/A"}`,
    `Time: ${new Date().toISOString()}`,
    "",
    "Please investigate.",
  ].join("\n");
  return `mailto:support@vantic.xyz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const supportHref = useMemo(() => buildSupportHref(error), [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0a", color: "white", fontFamily: "system-ui, sans-serif" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "64px" }}>
            <Image src="/icon.png" alt="Vantic" width={20} height={20} style={{ borderRadius: "2px", opacity: 0.6 }} />
            <span style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: "#4b5563" }}>
              Vantic
            </span>
          </div>

          <div style={{ width: "100%", maxWidth: "360px" }}>
            <p style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(220,38,38,0.8)", marginBottom: "20px", textAlign: "center" }}>
              Critical Error
            </p>

            {/* Pulsing indicator */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "24px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />
              <span style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "#f87171" }}>
                App crash
              </span>
            </div>

            <h1 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", textAlign: "center", marginBottom: "8px" }}>
              Vantic is down
            </h1>
            <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.6, textAlign: "center", marginBottom: "28px" }}>
              A critical error crashed the app. Retry to reload, or send the prefilled report to support.
            </p>

            {/* Error block */}
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", background: "rgba(255,255,255,0.03)", padding: "16px", marginBottom: "20px", fontFamily: "monospace" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#4b5563", marginBottom: "8px" }}>
                Error
              </p>
              <p style={{ fontSize: "11px", color: "#fca5a5", wordBreak: "break-all", lineHeight: 1.6 }}>
                {error?.message || "Unknown critical error"}
              </p>
              {error?.digest && (
                <p style={{ fontSize: "9px", color: "#374151", marginTop: "8px" }}>
                  digest: {error.digest}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={reset}
                style={{
                  flex: 1, padding: "12px", background: "#dc2626", border: "none", borderRadius: "12px",
                  color: "white", fontSize: "10px", fontWeight: 900, letterSpacing: "0.2em",
                  textTransform: "uppercase", cursor: "pointer",
                }}
              >
                Retry
              </button>
              <a
                href={supportHref}
                style={{
                  flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px", color: "white", fontSize: "10px", fontWeight: 900, letterSpacing: "0.2em",
                  textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                Report
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
