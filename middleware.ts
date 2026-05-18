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

  if (pathname.startsWith("/app")) {
    // Market detail pages are publicly viewable — auth is handled client-side
    if (/^\/app\/general\/[^/]+$/.test(pathname)) {
      return NextResponse.next();
    }

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
  matcher: ["/app/:path*"],
};
