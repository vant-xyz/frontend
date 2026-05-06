import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

async function proxyTo(backendPath: string, req: NextRequest): Promise<NextResponse> {
  if (!BACKEND_API_URL) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }
  const upstream = new URL(`${BACKEND_API_URL.replace(/\/$/, "")}/${backendPath}`);
  req.nextUrl.searchParams.forEach((v, k) => upstream.searchParams.append(k, v));

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (BACKEND_API_KEY) headers["X-API-Key"] = BACKEND_API_KEY;

  try {
    const resp = await fetch(upstream.toString(), { method: "GET", headers, cache: "no-store" });
    const body = await resp.text();
    return new NextResponse(body, {
      status: resp.status,
      headers: { "content-type": resp.headers.get("content-type") || "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Proxy failed" }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  return proxyTo("prices", req);
}
