import { Metadata } from "next";
import MarketDetailView from "@/components/ui/MarketDetailView";
import { getMarket } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await getMarket(id);
    const market = res.market;
    const title = market.title || "Vantic Prediction Market";
    const ogImageUrl = `https://vantic.xyz/app/general/${id}/opengraph-image`;
    return {
      title,
      description: market.description || "Trade YES/NO on Vantic",
      openGraph: {
        title,
        description: market.description || "Real-time prediction market",
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
        siteName: "Vantic",
      },
      twitter: {
        card: "summary_large_image",
        title,
        images: [ogImageUrl],
      },
    };
  } catch {
    return { title: "Vantic Market" };
  }
}

export default function Page() {
  return <MarketDetailView />;
}
