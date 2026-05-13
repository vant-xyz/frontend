import { ImageResponse } from "next/og";

interface OGMarket {
  title: string;
  description?: string;
  current_price?: number;
  market_type?: string;
  market_image_small?: string;
  market_image_banner?: string;
  asset?: string;
  status?: string;
  category?: string;
}

interface OGOrderbook {
  last_traded_price?: number;
  yes_bids?: { price: number }[];
}

const BASE_URL = "https://vantic.xyz";

async function fetchJSON<T>(url: string, headers: Record<string, string>, timeoutMs = 3000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, cache: "no-store", signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "https://vcs-api.vantic.xyz").replace(/\/$/, "");
  const apiKey = process.env.BACKEND_API_KEY;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;

  let market: OGMarket = { title: "Vantic Market", market_type: "GEM", category: "General" };
  let yesCents = 50;
  let noCents = 50;

  const [marketData, orderbookData] = await Promise.all([
    fetchJSON<{ market?: OGMarket } | OGMarket>(`${apiUrl}/markets/${id}`, headers),
    fetchJSON<{ orderbook?: OGOrderbook }>(`${apiUrl}/markets/${id}/orderbook`, headers),
  ]);

  if (marketData) {
    const m = (marketData as { market?: OGMarket }).market ?? (marketData as OGMarket);
    if (m?.title) market = m;
  }

  if (orderbookData?.orderbook) {
    const ob = orderbookData.orderbook;
    const raw = ob.yes_bids?.[0]?.price ?? ob.last_traded_price;
    if (raw != null && Number.isFinite(raw)) {
      const cents = raw <= 1 ? raw * 100 : raw;
      if (cents > 0 && cents < 100) {
        yesCents = cents;
        noCents = 100 - cents;
      }
    }
  }

  const yesPrice = yesCents.toFixed(1);
  const noPrice = noCents.toFixed(1);

  const rawBanner =
    market.market_image_banner ||
    market.market_image_small ||
    `/media/images/crypto_assets/${(market.asset || "btc").toLowerCase()}.png`;
  const bannerSrc = rawBanner.startsWith("http") ? rawBanner : `${BASE_URL}${rawBanner}`;
  const logoSrc = `${BASE_URL}/icons/icon-192x192.png`;

  const desc =
    market.description && market.description.length > 110
      ? market.description.slice(0, 110) + "..."
      : (market.description ?? "");

  const categoryLabel = market.category || (market.market_type === "GEM" ? "General" : "Crypto");
  const isGEM = market.market_type === "GEM";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0a",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Left: banner image */}
        <div
          style={{
            width: isGEM ? "50%" : "44%",
            height: "100%",
            display: "flex",
            overflow: "hidden",
          }}
        >
          <img
            src={bannerSrc}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "100%", background: "#1f1f1f", display: "flex" }} />

        {/* Right: content */}
        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "44px 48px",
            background: "#0a0a0a",
          }}
        >
          {/* Branding row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={logoSrc}
              style={{ width: 34, height: 34, objectFit: "contain" }}
            />
            <span style={{ color: "#555", fontSize: 17, fontWeight: 500 }}>
              vantic.xyz
            </span>
            <div style={{ flex: 1, display: "flex" }} />
            <span
              style={{
                color: "#888",
                fontSize: 12,
                fontWeight: 600,
                background: "#1a1a1a",
                padding: "4px 12px",
                borderRadius: 6,
                border: "1px solid #2a2a2a",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {categoryLabel}
            </span>
          </div>

          {/* Title + description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#f5f5f5",
                lineHeight: 1.18,
                letterSpacing: "-0.025em",
              }}
            >
              {market.title}
            </div>
            {desc ? (
              <div style={{ fontSize: 18, color: "#666", lineHeight: 1.55 }}>
                {desc}
              </div>
            ) : null}
          </div>

          {/* YES / NO badges */}
          <div style={{ display: "flex", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 20px",
                borderRadius: 8,
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.35)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "flex",
                }}
              />
              <span style={{ color: "#22c55e", fontSize: 20, fontWeight: 700 }}>
                YES &nbsp;{yesPrice}¢
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 20px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.35)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "flex",
                }}
              />
              <span style={{ color: "#ef4444", fontSize: 20, fontWeight: 700 }}>
                NO &nbsp;{noPrice}¢
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
