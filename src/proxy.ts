import { NextResponse } from "next/server";

import { auth } from "@/auth";

/**
 * Runs before every app page and its Server Action POSTs.
 *
 * Wrapping it in `auth()` decodes the session JWT and re-issues the cookie
 * with a fresh 30-minute expiry, so the session only ends after 30 minutes
 * without activity. Visitors without a valid session go to sign-in.
 *
 * This is still an optimistic check: the database lookup and the session
 * version (password change sign-out) are checked by `requireOfficer()`.
 */
export const proxy = auth((request) => {
  if (request.auth) return NextResponse.next();

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
});

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
