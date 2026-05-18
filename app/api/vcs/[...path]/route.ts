import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const API_KEY = process.env.BACKEND_API_KEY;

async function proxy(req: NextRequest, pathSegments: string[]) {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "NEXT_PUBLIC_API_URL not configured" }, { status: 500 });
  }

  const path = pathSegments.join("/");
  const upstream = new URL(`${BACKEND_URL}/${path}`);
  req.nextUrl.searchParams.forEach((v, k) => upstream.searchParams.append(k, v));

  const headers: Record<string, string> = {};
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const rawBody = hasBody ? await req.arrayBuffer() : undefined;

  try {
    const resp = await fetch(upstream.toString(), {
      method: req.method,
      headers,
      body: rawBody && rawBody.byteLength > 0 ? rawBody : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    const body = await resp.text();
    const outHeaders = new Headers();
    const contentTypeResp = resp.headers.get("content-type");
    if (contentTypeResp) outHeaders.set("content-type", contentTypeResp);
    const location = resp.headers.get("location");
    if (location) outHeaders.set("location", location);
    const setCookie = resp.headers.get("set-cookie");
    if (setCookie) outHeaders.set("set-cookie", setCookie);

    return new NextResponse(body, {
      status: resp.status,
      headers: outHeaders,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Upstream request failed" }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
