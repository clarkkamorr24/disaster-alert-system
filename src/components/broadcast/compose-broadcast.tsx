import Link from "next/link";
import { notFound } from "next/navigation";

import { ComposeForm } from "@/components/broadcast/compose-form";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { pickDefaultTemplate, renderComposeMessage } from "@/lib/broadcast/compose";
import { findUnreachedMembers } from "@/lib/broadcast/unreached";
import { formatManilaDateTime } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import { HAZARD_TYPES } from "@/lib/domain/hazards";
import { DEFAULT_SENDER_ID, getEnv } from "@/lib/env";
import { getSmsGateway } from "@/lib/sms";
import type { ComposeAlert, ComposeResend, ComposeZone } from "@/types/broadcast";

interface ComposeBroadcastProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function loadZones(): Promise<ComposeZone[]> {
  const zones = await prisma.farmZone.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { members: { where: { isActive: true } } } },
    },
  });
  return zones.map((zone) => ({ id: zone.id, name: zone.name, activeMemberCount: zone._count.members }));
}

function loadAlert(id: string) {
  return prisma.hazardAlert.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      hazardType: true,
      officialLevel: true,
      status: true,
      zones: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });
}

type ResendSource = ComposeResend & { content: string; alertId: string | null };

/** The broadcast being resent and its still-active unreached members, or `null` when it doesn't exist. */
async function loadResend(retryOfId: string): Promise<ResendSource | null> {
  const [original, members] = await Promise.all([
    prisma.broadcast.findUnique({
      where: { id: retryOfId },
      select: { content: true, createdAt: true, alertId: true },
    }),
    findUnreachedMembers(retryOfId),
  ]);
  if (!original) return null;
  return {
    content: original.content,
    alertId: original.alertId,
    originalSentAt: formatManilaDateTime(original.createdAt),
    retryOfId,
    memberCount: members.length,
    zoneNames: [...new Set(members.map((member) => member.zone.name))].sort((a, b) => a.localeCompare(b)),
  };
}

/** Removes the prefix the stored content starts with, so the form shows the message as typed. */
function stripPrefix(content: string, prefix: string): string {
  return content.startsWith(`${prefix} `) ? content.slice(prefix.length + 1) : content;
}

function param(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

/** Shown instead of the compose form when no zones exist yet. */
function AddZoneFirst() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-[22px]">
      <p className="text-sm text-muted-foreground">
        Broadcasts go to the members of chosen zones. Add a zone and its members first.
      </p>
      <Link href="/zones/new" className={buttonVariants({ className: "h-11 px-4 text-[13px]" })}>
        Add a zone first
      </Link>
    </div>
  );
}

/**
 * The page header and compose form, prefilled from the alert in `?alertId=`
 * when there is one. With `?retryOf=`, it resends the original message to
 * that broadcast's still-active unreached members instead. Render inside
 * `<Suspense>`.
 */
export async function ComposeBroadcast({ searchParams }: ComposeBroadcastProps) {
  const { alertId: alertParam, retryOf: retryParam } = await searchParams;
  await requireOfficer();

  const retryOfId = param(retryParam);
  const resend = retryOfId ? await loadResend(retryOfId) : null;
  if (retryOfId && !resend) notFound();

  // A resend stays linked to the original's alert.
  const alertId = resend ? resend.alertId : param(alertParam);
  const { SMS_MESSAGE_PREFIX, UNISMS_SENDER_ID } = getEnv();
  const [zones, templates, alert, balance] = await Promise.all([
    loadZones(),
    prisma.messageTemplate.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, hazardType: true, body: true },
    }),
    alertId ? loadAlert(alertId) : null,
    getSmsGateway().getCreditBalance(),
  ]);
  if (alertId && !alert) notFound();

  const composeAlert: ComposeAlert | null = alert && {
    id: alert.id,
    title: alert.title,
    hazardType: alert.hazardType,
    hazard: HAZARD_TYPES[alert.hazardType].label,
    level: alert.officialLevel ?? "",
    zoneIds: alert.zones.map((zone) => zone.id),
    zoneNames: alert.zones.map((zone) => zone.name),
  };
  const template = resend ? null : pickDefaultTemplate(templates, alert);
  const initialMessage = resend
    ? stripPrefix(resend.content, SMS_MESSAGE_PREFIX)
    : template
      ? renderComposeMessage(template.body, composeAlert, new Date())
      : "";

  const idempotencyKey = crypto.randomUUID();

  return (
    <>
      <PageHeader
        eyebrow="Association records"
        title={resend ? "Resend to not reached" : "New broadcast"}
        description={
          resend
            ? "Send the original message again to the members it didn't reach."
            : alert
              ? `An SMS about ${alert.title}. You confirm the recipients before anything is sent.`
              : "Write an announcement and pick the zones. You confirm the recipients before anything is sent."
        }
      />
      {zones.length === 0 && !resend ? (
        <AddZoneFirst />
      ) : (
        <ComposeForm
          // A fresh key per visit resets the form, which Activity would otherwise keep across navigations.
          key={idempotencyKey}
          idempotencyKey={idempotencyKey}
          prefix={SMS_MESSAGE_PREFIX}
          senderId={UNISMS_SENDER_ID}
          blockLinks={UNISMS_SENDER_ID === DEFAULT_SENDER_ID}
          balance={balance}
          zones={zones}
          templates={templates}
          alert={composeAlert}
          resend={
            resend && {
              retryOfId: resend.retryOfId,
              memberCount: resend.memberCount,
              zoneNames: resend.zoneNames,
              originalSentAt: resend.originalSentAt,
            }
          }
          initialTemplateId={template?.id ?? null}
          initialMessage={initialMessage}
        />
      )}
    </>
  );
}

/** Placeholder while {@link ComposeBroadcast} loads. */
export function ComposeBroadcastSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2 pt-[30px] pb-6">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-wrap items-start gap-4">
        <Skeleton className="h-[560px] min-w-0 flex-[3_1_440px] rounded-xl" />
        <Skeleton className="h-[520px] min-w-0 flex-[2_1_300px] rounded-xl" />
      </div>
    </>
  );
}
