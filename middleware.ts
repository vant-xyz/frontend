import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BOT_UA = [
  "facebookexternalhit",
  "Twitterbot",
  "WhatsApp",
  "LinkedInBot",
  "TelegramBot",
  "Slackbot",
  "Discordbot",
  "Googlebot",
  "bingbot",
  "Applebot",
  "Embedly",
  "rogerbot",
  "outbrain",
  "W3C_Validator",
];

function isSocialBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") || "";
  return BOT_UA.some((bot) => ua.includes(bot));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow opengraph-image endpoints — social crawlers must reach them
  if (pathname.endsWith("/opengraph-image")) {
    return NextResponse.next();
  }

  // Let social media bots read page HTML so they see the og: meta tags
  if (isSocialBot(request)) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get("auth_token")?.value;

  // v2 (/app) is wallet-based and fully client-guarded — no server gating.
  // Only the legacy v1 app (/v1) is gated here. Wiring lands later.
  if (pathname.startsWith("/v1")) {
    if (!authToken) {
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();
    response.headers.set("x-auth-status", "authenticated");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/v1/:path*"],
};
