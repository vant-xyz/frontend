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
    const iter = client.TransactionService.getAllTransactionsForAddress(
      chain as any,
      address
    );

    for await (const page of iter) {
      if (page.error) {
        return NextResponse.json({ error: page.error_message }, { status: 502 });
      }
      return NextResponse.json(page.data);
    }

    return NextResponse.json({ items: [], pagination: null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to fetch transactions" }, { status: 500 });
  }
}
