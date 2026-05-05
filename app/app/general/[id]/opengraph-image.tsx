import { getMarket, getTrades, Market } from "@/lib/api";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let market: Market;
  let volume = 0;

  try {
    const res = await getMarket(id);
    market = res.market;
  } catch {
    market = { title: "Vantic Market", current_price: 50, market_type: "GEM" } as Market;
  }

  try {
    const trades = await getTrades(id, 200);
    volume = trades.trades.reduce((acc, t) => acc + Number(t.price || 0) * Number(t.quantity || 0), 0) / 100;
  } catch {
    volume = 0;
  }

  const yesPrice = Number((market.current_price ?? 50).toFixed(1));
  const noPrice = Number((100 - (market.current_price ?? 50)).toFixed(1));
  const rightImage = market.market_image_small || `/media/images/crypto_assets/${(market.asset || "btc").toLowerCase()}.png`;

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
