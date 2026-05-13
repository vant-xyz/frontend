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
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://vcs-api.vantic.xyz";
  let market: OGMarket;

  try {
    const res = await fetch(`${apiUrl}/markets/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("not ok");
    const data = await res.json();
    market = data.market;
  } catch {
    market = { title: "Vantic Market", current_price: 50, market_type: "GEM" };
  }

  const yesPrice = (market.current_price ?? 50).toFixed(1);
  const noPrice = (100 - (market.current_price ?? 50)).toFixed(1);
  const BASE_URL = "https://vantic.xyz";

  const rawBanner =
    market.market_image_banner ||
    market.market_image_small ||
    `/media/images/crypto_assets/${(market.asset || "btc").toLowerCase()}.png`;
  const bannerSrc = rawBanner.startsWith("http") ? rawBanner : `${BASE_URL}${rawBanner}`;

  const desc =
    market.description && market.description.length > 110
      ? market.description.slice(0, 110) + "..."
      : (market.description ?? "");

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
            width: "44%",
            height: "100%",
            display: "flex",
            overflow: "hidden",
          }}
        >
          <img
            src={bannerSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "100%",
            background: "#1f1f1f",
            display: "flex",
          }}
        />

        {/* Right: content */}
        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "44px 50px",
            background: "#0a0a0a",
          }}
        >
          {/* Branding row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              V
            </div>
            <span style={{ color: "#555", fontSize: 18, fontWeight: 500 }}>
              vantic.xyz
            </span>
            <div style={{ flex: 1, display: "flex" }} />
            <span
              style={{
                color: "#444",
                fontSize: 15,
                fontWeight: 500,
                background: "#111",
                padding: "4px 12px",
                borderRadius: 6,
                border: "1px solid #222",
              }}
            >
              {market.market_type === "GEM" ? "GEM" : "CAPPM"}
            </span>
          </div>

          {/* Title + description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                fontSize: 38,
                fontWeight: 800,
                color: "#f5f5f5",
                lineHeight: 1.18,
                letterSpacing: "-0.025em",
              }}
            >
              {market.title}
            </div>
            {desc ? (
              <div
                style={{
                  fontSize: 19,
                  color: "#666",
                  lineHeight: 1.55,
                }}
              >
                {desc}
              </div>
            ) : null}
          </div>

          {/* YES / NO badges */}
          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 22px",
                borderRadius: 8,
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.35)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "flex",
                }}
              />
              <span style={{ color: "#22c55e", fontSize: 22, fontWeight: 700 }}>
                YES &nbsp;{yesPrice}¢
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 22px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.35)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "flex",
                }}
              />
              <span style={{ color: "#ef4444", fontSize: 22, fontWeight: 700 }}>
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
