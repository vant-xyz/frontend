import { Metadata } from "next";
import MarketDetailView from "@/components/ui/MarketDetailView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "https://vcs-api.vantic.xyz").replace(/\/$/, "");
  const apiKey = process.env.BACKEND_API_KEY;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;

  const ogImageUrl = `https://vantic.xyz/app/general/${id}/opengraph-image`;

  try {
    const res = await fetch(`${apiUrl}/v1/markets/${id}`, { headers, cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    const data = await res.json();
    const market = data?.market ?? data;
    const title = market?.title || "Vantic Prediction Market";
    const description = market?.description || "Trade YES or NO on real-world outcomes. Powered by Vantic.";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://vantic.xyz/app/general/${id}`,
        siteName: "Vantic",
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return {
      title: "Vantic Prediction Market",
      openGraph: {
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        images: [ogImageUrl],
      },
    };
  }
}

export default function Page() {
  return <MarketDetailView />;
}
