import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMarket } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const { market } = await getMarket(id);
    const title = market.title || "Vantic Market";
    return {
      title,
      description: market.description || "Trade YES/NO on Vantic",
      openGraph: {
        title,
        description: market.description || "Real-time prediction market",
        images: [{ url: `/app/general/${id}/opengraph-image`, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        images: [`/app/general/${id}/opengraph-image`],
      },
    };
  } catch {
    return { title: "Vantic Market" };
  }
}

export default async function MarketCanonicalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/general/${id}`);
}
