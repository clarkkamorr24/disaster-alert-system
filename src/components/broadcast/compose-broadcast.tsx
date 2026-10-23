import Link from "next/link";
import { notFound } from "next/navigation";

import { HazardBadge } from "@/components/alerts/hazard-badge";
import { SeverityBadge } from "@/components/alerts/severity-badge";
import { ComposeForm } from "@/components/broadcast/compose-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      severity: true,
      officialLevel: true,
      status: true,
      zones: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });
}

type ResendSource = ComposeResend & { content: string; createdAt: Date; alertId: string | null };

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
    ...original,
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
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground">
        Broadcasts go to the members of chosen zones. Add a zone and its members first.
      </p>
      <Link href="/zones/new" className={buttonVariants({ className: "h-11 px-4 text-base" })}>
        Add a zone first
      </Link>
    </div>
  );
}

/**
 * The compose form, prefilled from the alert in `?alertId=` when there is one.
 * With `?retryOf=`, it resends the original message to that broadcast's
 * still-active unreached members instead. Render inside `<Suspense>`.
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
      {resend && (
        <Card size="sm">
          <CardContent className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">
              Resending to {resend.memberCount} {resend.memberCount === 1 ? "member who was" : "members who were"} not
              reached
            </h2>
            <Link
              href={`/broadcasts/${resend.retryOfId}`}
              className="inline-flex min-h-11 w-fit items-center text-primary hover:underline"
            >
              Original broadcast of {formatManilaDateTime(resend.createdAt)}
            </Link>
          </CardContent>
        </Card>
      )}
      {alert && (
        <Card size="sm">
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">About this alert</p>
            <Link href={`/alerts/${alert.id}`} className="inline-flex min-h-11 w-fit items-center font-medium hover:underline">
              {alert.title}
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <HazardBadge type={alert.hazardType} />
              <SeverityBadge severity={alert.severity} />
              {alert.status === "RESOLVED" && <Badge variant="secondary">Resolved</Badge>}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent>
          {zones.length === 0 && !resend ? (
            <AddZoneFirst />
          ) : (
            <ComposeForm
              // A fresh key per visit resets the form, which Activity would otherwise keep across navigations.
              key={idempotencyKey}
              idempotencyKey={idempotencyKey}
              prefix={SMS_MESSAGE_PREFIX}
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
                }
              }
              initialTemplateId={template?.id ?? null}
              initialMessage={initialMessage}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}

/** Placeholder while {@link ComposeBroadcast} loads. */
export function ComposeBroadcastSkeleton() {
  return <Skeleton className="h-160 rounded-xl" />;
}
