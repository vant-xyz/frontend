import { NextRequest, NextResponse } from "next/server";
import { getGoldRushClient } from "@/lib/goldrush-server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const chain = searchParams.get("chain") ?? "solana-mainnet";
  const txHash = searchParams.get("tx_hash");

  if (!txHash) {
    return NextResponse.json({ error: "tx_hash is required" }, { status: 400 });
  }

  try {
    const client = getGoldRushClient();
    const resp = await client.TransactionService.getTransaction(
      chain as any,
      txHash
    );

    if (resp.error) {
      return NextResponse.json({ error: resp.error_message }, { status: 502 });
    }

    return NextResponse.json(resp.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to fetch transaction" }, { status: 500 });
  }
}
