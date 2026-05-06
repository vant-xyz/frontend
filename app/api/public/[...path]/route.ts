import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    if (!BACKEND_API_URL) {
      return NextResponse.json({ error: "NEXT_PUBLIC_API_URL is not configured" }, { status: 500 });
    }
    const path = (params.path || []).join("/");
    const upstream = new URL(`${BACKEND_API_URL.replace(/\/$/, "")}/${path}`);
    req.nextUrl.searchParams.forEach((value, key) => upstream.searchParams.append(key, value));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (BACKEND_API_KEY) {
      headers["X-API-Key"] = BACKEND_API_KEY;
    }

    const resp = await fetch(upstream.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const contentType = resp.headers.get("content-type") || "application/json";
    const body = await resp.text();
    return new NextResponse(body, {
      status: resp.status,
      headers: { "content-type": contentType },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Proxy request failed" }, { status: 500 });
  }
}
