import { NextRequest, NextResponse } from "next/server";
import { getGoldRushClient } from "@/lib/goldrush-server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const chain = searchParams.get("chain") ?? "solana-mainnet";
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  try {
    const client = getGoldRushClient();
    const resp = await client.TransactionService.getTransactionSummary(
      chain as any,
      address
    );

    if (resp.error) {
      return NextResponse.json({ error: resp.error_message }, { status: 502 });
    }

    return NextResponse.json(resp.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to fetch summary" }, { status: 500 });
  }
}
