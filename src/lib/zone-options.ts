import "server-only";

import { prisma } from "@/lib/db";
import type { ZoneOption } from "@/types/member";

/**
 * Lists every zone for a zone picker.
 *
 * @returns Zone ids and names, ordered by name.
 */
export async function getZoneOptions(): Promise<ZoneOption[]> {
  return prisma.farmZone.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}
