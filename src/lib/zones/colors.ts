import "server-only";

import { prisma } from "@/lib/db";
import { firstUnusedZoneColor, type ZoneColor } from "@/lib/zone-colors";

/**
 * The color the zone form starts on: the first one no other zone uses.
 *
 * @param exceptId - The zone being edited, whose own color doesn't count as used.
 * @returns A {@link ZoneColor}.
 */
export async function getDefaultZoneColor(exceptId?: string): Promise<ZoneColor> {
  const zones = await prisma.farmZone.findMany({
    where: exceptId ? { id: { not: exceptId } } : undefined,
    select: { color: true },
  });
  return firstUnusedZoneColor(zones.map((zone) => zone.color));
}
