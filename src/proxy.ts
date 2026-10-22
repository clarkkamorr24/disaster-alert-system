import { NextResponse, type NextRequest } from "next/server";

// Auth.js uses the __Secure- name over HTTPS and the plain name over HTTP (local dev).
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

/**
 * Optimistic check: sends visitors without a session cookie to sign-in.
 * The real check (database lookup and session version) is `requireOfficer()`.
 */
export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/alerts/:path*",
    "/zones/:path*",
    "/members/:path*",
    "/broadcasts/:path*",
    "/templates/:path*",
    "/settings/:path*",
  ],
};
