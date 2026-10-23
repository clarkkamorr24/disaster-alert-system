import "server-only";

import type { RecipientStatus } from "@/generated/prisma/enums";
import { deriveBroadcastStatus, emptyStatusCounts } from "@/lib/broadcast/status";
import { prisma } from "@/lib/db";

/**
 * Loads broadcasts newest first, each with its recipient count and derived
 * status, for the broadcast history and the dashboard.
 *
 * @param skip - How many of the newest broadcasts to pass over.
 * @param take - How many broadcasts to return.
 * @returns The broadcasts with `recipientCount` and `status`.
 */
export async function loadBroadcastSummaries(skip: number, take: number) {
  const broadcasts = await prisma.broadcast.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take,
    select: {
      id: true,
      createdAt: true,
      retryOfId: true,
      alert: { select: { title: true, hazardType: true } },
    },
  });
  const groups = await prisma.broadcastRecipient.groupBy({
    by: ["broadcastId", "status"],
    where: { broadcastId: { in: broadcasts.map((broadcast) => broadcast.id) } },
    _count: { _all: true },
  });

  const countsById = new Map<string, Record<RecipientStatus, number>>();
  for (const group of groups) {
    const counts = countsById.get(group.broadcastId) ?? emptyStatusCounts();
    counts[group.status] = group._count._all;
    countsById.set(group.broadcastId, counts);
  }

  return broadcasts.map((broadcast) => {
    const counts = countsById.get(broadcast.id) ?? emptyStatusCounts();
    return {
      ...broadcast,
      recipientCount: Object.values(counts).reduce((sum, count) => sum + count, 0),
      status: deriveBroadcastStatus(counts),
    };
  });
}
