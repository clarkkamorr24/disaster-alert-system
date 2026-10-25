"use server";

import { requireOfficer } from "@/lib/auth/dal";
import { broadcastTitle } from "@/lib/broadcast/title";
import { prisma } from "@/lib/db";
import { formatPhoneForDisplay } from "@/lib/domain/phone";
import { getEnv } from "@/lib/env";
import { MEMBERS_PER_PAGE, memberListWhere } from "@/lib/members/list-filters";
import { searchQuerySchema } from "@/lib/validation/search";
import type { ActionResult } from "@/types/action-result";
import type { SearchResults } from "@/types/search";

/** How many results each group of the header search shows. */
const RESULTS_PER_GROUP = 5;

/**
 * Finds members (name, phone, or zone name, any status), alerts (title), and
 * broadcasts (alert title or message), newest first, 5 of each.
 */
export async function searchEverything(query: string): Promise<ActionResult<SearchResults>> {
  await requireOfficer();

  const parsed = searchQuerySchema.safeParse(query);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const q = parsed.data;

  try {
    const contains = { contains: q, mode: "insensitive" as const };
    const [members, alerts, broadcasts] = await Promise.all([
      prisma.member.findMany({
        where: {
          OR: [
            memberListWhere({ q, zoneId: undefined, status: "all", page: 1, size: MEMBERS_PER_PAGE }),
            { zone: { name: contains } },
          ],
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: RESULTS_PER_GROUP,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          zone: { select: { name: true } },
        },
      }),
      prisma.hazardAlert.findMany({
        where: { title: contains },
        orderBy: { createdAt: "desc" },
        take: RESULTS_PER_GROUP,
        select: { id: true, title: true, severity: true, status: true },
      }),
      prisma.broadcast.findMany({
        where: { OR: [{ alert: { title: contains } }, { content: contains }] },
        orderBy: { createdAt: "desc" },
        take: RESULTS_PER_GROUP,
        select: { id: true, content: true, createdAt: true, alert: { select: { title: true } } },
      }),
    ]);

    const prefix = getEnv().SMS_MESSAGE_PREFIX;
    return {
      success: true,
      data: {
        members: members.map((member) => ({
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          phone: formatPhoneForDisplay(member.phone),
          zoneName: member.zone.name,
          isActive: member.isActive,
        })),
        alerts,
        broadcasts: broadcasts.map((broadcast) => ({
          id: broadcast.id,
          title: broadcastTitle({
            alertTitle: broadcast.alert?.title ?? null,
            content: broadcast.content,
            prefix,
          }),
          createdAt: broadcast.createdAt,
        })),
      },
    };
  } catch (error) {
    console.error("searchEverything failed", error);
    return { success: false, error: "Search is unavailable. Try again." };
  }
}
