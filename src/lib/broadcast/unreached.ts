import "server-only";

import { prisma } from "@/lib/db";

/**
 * Finds the members a broadcast didn't reach (failed or skipped) who are
 * still active, with their current phone, for a resend.
 *
 * @param broadcastId - The broadcast to resend.
 * @returns The members, sorted by last then first name.
 */
export function findUnreachedMembers(broadcastId: string) {
  return prisma.member.findMany({
    where: {
      isActive: true,
      recipients: { some: { broadcastId, status: { in: ["FAILED", "SKIPPED"] } } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, phone: true, zone: { select: { name: true } } },
  });
}
