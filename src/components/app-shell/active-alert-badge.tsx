import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";

/** The Alerts nav badge: how many alerts are active. Renders nothing at 0. Render inside `<Suspense>`. */
export async function ActiveAlertBadge() {
  await requireOfficer();
  const count = await prisma.hazardAlert.count({ where: { status: "ACTIVE" } });
  if (count === 0) return null;

  return (
    <span className="grid h-[21px] min-w-[21px] place-items-center rounded-full bg-white/[.13] px-1.5 text-[11px] font-bold text-[#d8f3df]">
      {count}
      <span className="sr-only"> active</span>
    </span>
  );
}
