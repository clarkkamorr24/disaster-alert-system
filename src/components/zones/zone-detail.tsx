import { Leaf, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cn } from "cn";

import { DetailCard } from "@/components/layout/detail-card";
import { StatusPill } from "@/components/layout/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WeatherCard, WeatherCardSkeleton } from "@/components/weather/weather-card";
import { DeleteZoneButton } from "@/components/zones/delete-zone-button";
import { ZoneForm } from "@/components/zones/zone-form";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { formatCoordinates } from "@/lib/domain/coordinates";
import { SEVERITIES, worstSeverity } from "@/lib/domain/hazards";
import { formatPhoneForDisplay } from "@/lib/domain/phone";
import { isCriticalActive, severityTone } from "@/lib/domain/status-tone";
import { toZoneColor } from "@/lib/zone-colors";
import { getDefaultZoneColor } from "@/lib/zones/colors";
import type { ZoneBoundary, ZoneFormValues } from "@/types/zone";

interface ZoneDetailProps {
  params: Promise<{ id: string }>;
}

interface ZoneMember {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
}

function loadZone(id: string) {
  return prisma.farmZone.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      latitude: true,
      longitude: true,
      boundary: true,
      color: true,
      members: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: { id: true, firstName: true, lastName: true, phone: true, isActive: true },
      },
      alerts: { where: { status: "ACTIVE" }, select: { severity: true } },
    },
  });
}

function MemberTable({ members }: { members: ZoneMember[] }) {
  return (
    <div className="-mx-5 -mb-5 border-t">
      <Table className="min-w-[480px]">
        <TableHeader>
          <TableRow>
            <TableHead className="px-5">Member</TableHead>
            <TableHead>Mobile number</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="h-[54px] px-5">
                <Link
                  href={`/members/${member.id}`}
                  className="inline-flex min-h-11 items-center font-semibold text-title-foreground hover:text-primary hover:underline"
                >
                  {member.firstName} {member.lastName}
                </Link>
              </TableCell>
              <TableCell>
                <a href={`tel:${member.phone}`} className="inline-flex min-h-11 items-center gap-1.5 tabular-nums hover:text-primary hover:underline">
                  <Phone className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
                  {formatPhoneForDisplay(member.phone)}
                </a>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[11px] font-semibold",
                    member.isActive ? "text-status-clear" : "text-status-neutral",
                  )}
                >
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** The header, edit form, weather, members, and delete action for one zone. Render inside `<Suspense>`. */
export async function ZoneDetail({ params }: ZoneDetailProps) {
  const { id } = await params;
  await requireOfficer();

  const [zone, defaultColor] = await Promise.all([loadZone(id), getDefaultZoneColor(id)]);
  if (!zone) notFound();

  const { members, alerts, boundary, color, ...rest } = zone;
  const values: ZoneFormValues = {
    ...rest,
    // Written only through zoneInputSchema, so a stored boundary is always a valid ZoneBoundary.
    boundary: boundary as ZoneBoundary | null,
    color: color ? toZoneColor(color) : defaultColor,
  };
  const worst = worstSeverity(alerts.map((alert) => alert.severity));
  const activeCount = members.filter((member) => member.isActive).length;

  return (
    <>
      <header className="flex items-start gap-3.5 rounded-xl border bg-card p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-status-clear-soft text-status-clear">
          <Leaf className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[11px] font-bold tracking-[.08em] text-muted-foreground uppercase">Farm zone</p>
          <h1 className="font-heading text-[22px] leading-tight font-bold tracking-[-0.03em]">{zone.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <StatusPill tone={severityTone(worst)} pulse={isCriticalActive(worst)}>
              {worst ? SEVERITIES[worst].label : "Clear"}
            </StatusPill>
            <span className="text-[13px] text-muted-foreground tabular-nums">
              {formatCoordinates(zone.latitude, zone.longitude)}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <DetailCard title="Zone details">
          {/* Keyed so a saved edit re-mounts the form with the new values. */}
          <ZoneForm
            key={`${values.name}|${values.description}|${values.latitude}|${values.longitude}|${values.color}|${JSON.stringify(values.boundary)}`}
            zone={values}
          />
        </DetailCard>
        <Suspense fallback={<WeatherCardSkeleton />}>
          <WeatherCard zone={{ id: zone.id, latitude: zone.latitude, longitude: zone.longitude }} />
        </Suspense>
      </div>

      <DetailCard
        title="Members"
        className="overflow-hidden"
        description={
          members.length === 0
            ? "No members live in this zone yet."
            : `${members.length} ${members.length === 1 ? "member lives" : "members live"} in this zone, ${activeCount} active.`
        }
      >
        {members.length > 0 && <MemberTable members={members} />}
      </DetailCard>

      <DetailCard
        title="Delete zone"
        description="A zone can only be deleted once it has no members, active or inactive."
      >
        <div>
          <DeleteZoneButton id={zone.id} name={zone.name} />
        </div>
      </DetailCard>
    </>
  );
}

/** Placeholder while {@link ZoneDetail} loads. */
export function ZoneDetailSkeleton() {
  return (
    <>
      <Skeleton className="h-[118px] rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Skeleton className="h-[480px] rounded-xl" />
        <Skeleton className="h-[330px] rounded-xl" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </>
  );
}
