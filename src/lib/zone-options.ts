import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/db";
import type { ZoneOption } from "@/types/member";

/**
 * Lists every zone for a zone picker. Cached per request, so a page with
 * several pickers (such as `/members` with its filter and Add member pop-up)
 * queries once.
 *
 * @returns Zone ids and names, ordered by name.
 */
export const getZoneOptions = cache(async (): Promise<ZoneOption[]> => {
  return prisma.farmZone.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
});
