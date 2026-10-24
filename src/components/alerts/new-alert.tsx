import Link from "next/link";

import { NewAlertComposer } from "@/components/alerts/new-alert-composer";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { DEFAULT_SENDER_ID, getEnv } from "@/lib/env";
import { getSmsGateway } from "@/lib/sms";
import type { ComposeZone } from "@/types/broadcast";

async function loadZones(): Promise<ComposeZone[]> {
  const zones = await prisma.farmZone.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { members: { where: { isActive: true } } } } },
  });
  return zones.map((zone) => ({ id: zone.id, name: zone.name, activeMemberCount: zone._count.members }));
}

/** Shown instead of the form when no zones exist yet. */
function AddZoneFirst() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-[22px]">
      <p className="text-sm text-muted-foreground">
        Alerts name the zones they affect. Add a zone first, then come back to log the alert.
      </p>
      <Link href="/zones/new" className={buttonVariants({ className: "h-11 px-4 text-[13px]" })}>
        Add a zone first
      </Link>
    </div>
  );
}

/** The New alert form with zones, templates, and the credit balance loaded. Render inside `<Suspense>`. */
export async function NewAlert() {
  await requireOfficer();
  const { SMS_MESSAGE_PREFIX, UNISMS_SENDER_ID } = getEnv();
  const [zones, templates, balance] = await Promise.all([
    loadZones(),
    prisma.messageTemplate.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, hazardType: true, body: true },
    }),
    getSmsGateway().getCreditBalance(),
  ]);
  if (zones.length === 0) return <AddZoneFirst />;

  const idempotencyKey = crypto.randomUUID();
  return (
    <NewAlertComposer
      // A fresh key per visit resets the form, which Activity would otherwise keep across navigations.
      key={idempotencyKey}
      idempotencyKey={idempotencyKey}
      prefix={SMS_MESSAGE_PREFIX}
      senderId={UNISMS_SENDER_ID}
      blockLinks={UNISMS_SENDER_ID === DEFAULT_SENDER_ID}
      balance={balance}
      zones={zones}
      templates={templates}
    />
  );
}

/** Placeholder while {@link NewAlert} loads. */
export function NewAlertSkeleton() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Skeleton className="h-[900px] min-w-0 flex-[3_1_440px] rounded-xl" />
      <Skeleton className="h-[520px] min-w-0 flex-[2_1_300px] rounded-xl" />
    </div>
  );
}
