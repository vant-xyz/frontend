import { ImageResponse } from "next/og";

export const runtime = "edge";

interface OGMarket {
  title: string;
  current_price?: number;
  market_type?: string;
  market_image_small?: string;
  asset?: string;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://vcs-api.vantic.xyz";
  let market: OGMarket;
  let volume = 0;

  try {
    const res = await fetch(`${apiUrl}/markets/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("not ok");
    const data = await res.json();
    market = data.market;
  } catch {
    market = { title: "Vantic Market", current_price: 50, market_type: "GEM" };
  }

  try {
    const res = await fetch(`${apiUrl}/markets/${id}/trades?limit=200`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      volume = (data.trades || []).reduce(
        (acc: number, t: any) => acc + Number(t.price || 0) * Number(t.quantity || 0),
        0
      ) / 100;
    }
  } catch {
    volume = 0;
  }

  const yesPrice = Number((market.current_price ?? 50).toFixed(1));
  const noPrice = Number((100 - (market.current_price ?? 50)).toFixed(1));
  const BASE_URL = "https://vantic.xyz";
  const rawImage = market.market_image_small || `/media/images/crypto_assets/${(market.asset || "btc").toLowerCase()}.png`;
  const rightImage = rawImage.startsWith("http") ? rawImage : `${BASE_URL}${rawImage}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: "#000",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            width: "50%",
            height: "100%",
            background: "#000",
            padding: "48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 18, color: "#888" }}>Vantic • {market.market_type}</div>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.12 }}>{market.title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 34, color: "#22c55e", fontWeight: 700 }}>YES {yesPrice.toFixed(1)}¢</div>
            <div style={{ fontSize: 34, color: "#ef4444", fontWeight: 700 }}>NO {noPrice.toFixed(1)}¢</div>
            <div style={{ fontSize: 24, color: "#bbb" }}>Volume ${volume.toFixed(2)}</div>
          </div>
        </div>

        <div
          style={{
            width: "50%",
            height: "100%",
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img
            src={rightImage}
            alt="market visual"
            style={{
              width: market.market_type === "GEM" ? "100%" : "auto",
              height: market.market_type === "GEM" ? "100%" : "70%",
              objectFit: market.market_type === "GEM" ? "cover" : "contain",
            }}
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
