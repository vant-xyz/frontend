// app/general/[id]/page.tsx
import { Metadata } from 'next';
import MarketDetailView from '../../../../components/ui/MarketDetailView';   // ← Client component
import { getMarket } from '@/lib/api';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }  // ← Promise type
): Promise<Metadata> {
  const { id } = await params; 
  let market;
  try {
    const res = await getMarket(id);
    market = res.market;
  } catch (e) {
    market = { title: "Vantic Market" };
  }

  const title = market.title || "Vantic Prediction Market";

  return {
    title: title,
    description: market.description || "Trade YES/NO on the fastest prediction market on Solana",
    openGraph: {
      title: title,
      description: market.description || "Real-time prediction market",
      images: [
        {
          url: `/app/general/${id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: "Vantic",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      images: [`/app/general/${id}/opengraph-image`],
    },
  };
}

export default function Page({ params }: { params: { id: string } }) {
  return <MarketDetailView />;   // pass any props if needed
}