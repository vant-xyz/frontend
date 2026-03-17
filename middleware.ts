import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for auth token in cookies
  const authToken = request.cookies.get("auth_token")?.value;

  // For /app/* routes, enforce authentication
  if (request.nextUrl.pathname.startsWith("/app")) {
    // If no auth token, redirect to home page
    if (!authToken) {
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Add header for debugging/optional client use
    const response = NextResponse.next();
    response.headers.set("x-auth-status", "authenticated");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
