import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { SessionOfficer } from "@/types/auth";

/**
 * Checks whether a session is still valid for the officer account.
 *
 * A password change bumps the officer's `sessionVersion`, so a token issued
 * before the change carries an older version and is rejected.
 *
 * @param tokenVersion - The version carried in the session token.
 * @param dbVersion - The officer's current version in the database.
 * @returns `true` only when both versions are equal.
 */
export function isSessionCurrent(tokenVersion: number | undefined, dbVersion: number): boolean {
  return tokenVersion === dbVersion;
}

/**
 * Reads the session and checks it against the database.
 *
 * Cached per request, so the layout and the page share one lookup.
 *
 * @returns The officer from the database row, or `null` when there is no
 * session, the officer no longer exists, or the session version is stale.
 */
export const getCurrentOfficer = cache(async (): Promise<SessionOfficer | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const officer = await prisma.officer.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, sessionVersion: true },
  });
  if (!officer || !isSessionCurrent(session.user.sessionVersion, officer.sessionVersion)) {
    return null;
  }
  return officer;
});

/**
 * Returns the signed-in officer, or redirects to `/sign-in`.
 *
 * Call this first in every Server Action and every data-reading Server
 * Component. Must run inside a `<Suspense>` boundary, since it reads cookies.
 *
 * @returns The officer's current name, email, and session version from the database.
 */
export async function requireOfficer(): Promise<SessionOfficer> {
  const officer = await getCurrentOfficer();
  if (!officer) redirect("/sign-in");
  return officer;
}
