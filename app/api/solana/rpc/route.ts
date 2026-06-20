import { NextRequest, NextResponse } from "next/server";

// SOLANA_RPC_URL is server-only — never use NEXT_PUBLIC_ for paid RPC endpoints.
const RPC_URL = process.env.SOLANA_RPC_URL;

export async function POST(req: NextRequest) {
  if (!RPC_URL) {
    return NextResponse.json({ error: "RPC not configured" }, { status: 500 });
  }

  const body = await req.text();

  try {
    const resp = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });

    const data = await resp.text();
    return new NextResponse(data, {
      status: resp.status,
      headers: { "content-type": resp.headers.get("content-type") || "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "RPC request failed" }, { status: 502 });
  }
}
