import { Bell } from "lucide-react";

import { HEADER_ICON_BUTTON } from "@/components/app-shell/header-styles";
import { NotificationsMenu } from "@/components/app-shell/notifications-menu";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { SEVERITIES } from "@/lib/domain/hazards";

/** How many active alerts the bell lists. */
const BELL_LIMIT = 5;

/** The header bell: a red dot and a menu of the worst active alerts. Render inside `<Suspense>`. */
export async function NotificationsBell() {
  await requireOfficer();
  const alerts = await prisma.hazardAlert.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      severity: true,
      createdAt: true,
      zones: { select: { name: true }, orderBy: { name: "asc" } },
    },
  });

  const worstFirst = alerts
    .toSorted(
      (a, b) =>
        SEVERITIES[b.severity].rank - SEVERITIES[a.severity].rank ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    )
    .slice(0, BELL_LIMIT)
    .map((alert) => ({
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      zones: alert.zones.map((zone) => zone.name).join(", "),
    }));

  return <NotificationsMenu total={alerts.length} alerts={worstFirst} />;
}

/** Shown while the bell loads: the same button without the dot, not yet clickable. */
export function NotificationsBellFallback() {
  return (
    <span className={HEADER_ICON_BUTTON} aria-hidden="true">
      <Bell strokeWidth={1.75} />
    </span>
  );
}
