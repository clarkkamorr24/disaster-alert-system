import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { RecipientStatus } from "@/generated/prisma/enums";
import { deriveBroadcastStatus, emptyStatusCounts } from "@/lib/broadcast/status";
import { broadcastTitle } from "@/lib/broadcast/title";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";

/**
 * Loads broadcasts newest first, each with its recipient counts and derived
 * status, for the broadcast history and the dashboard.
 *
 * @param skip - How many of the newest broadcasts to pass over.
 * @param take - How many broadcasts to return.
 * @returns The broadcasts with `title` (see `broadcastTitle`), `recipientCount`,
 *   `sent`, `notReached` (failed + skipped), and `status`.
 */
export async function loadBroadcastSummaries(skip: number, take: number) {
  const broadcasts = await prisma.broadcast.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take,
    select: {
      id: true,
      createdAt: true,
      content: true,
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

  const prefix = getEnv().SMS_MESSAGE_PREFIX;
  return broadcasts.map((broadcast) => {
    const counts = countsById.get(broadcast.id) ?? emptyStatusCounts();
    return {
      ...broadcast,
      title: broadcastTitle({ alertTitle: broadcast.alert?.title ?? null, content: broadcast.content, prefix }),
      recipientCount: Object.values(counts).reduce((sum, count) => sum + count, 0),
      sent: counts.SENT,
      notReached: counts.FAILED + counts.SKIPPED,
      status: deriveBroadcastStatus(counts),
    };
  });
}

/**
 * Finds the zones each broadcast reached, through its recipients' members'
 * current home zones. Recipients whose member was deleted are left out.
 *
 * @param ids - Broadcast ids.
 * @returns Zone names by broadcast id; a broadcast with no zones has no entry.
 */
export async function loadBroadcastZoneNames(ids: string[]): Promise<Map<string, string[]>> {
  const namesById = new Map<string, string[]>();
  if (ids.length === 0) return namesById;

  const rows = await prisma.$queryRaw<{ broadcastId: string; name: string }[]>`
    SELECT DISTINCT r."broadcastId", z."name"
    FROM "broadcast_recipient" r
    JOIN "member" m ON m."id" = r."memberId"
    JOIN "farm_zone" z ON z."id" = m."zoneId"
    WHERE r."broadcastId" IN (${Prisma.join(ids)})
  `;
  for (const row of rows) {
    namesById.set(row.broadcastId, [...(namesById.get(row.broadcastId) ?? []), row.name]);
  }
  return namesById;
}
