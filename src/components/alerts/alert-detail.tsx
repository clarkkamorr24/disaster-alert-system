import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { HazardBadge } from "@/components/alerts/hazard-badge";
import { ResolveAlertButton } from "@/components/alerts/resolve-alert-button";
import { SeverityBadge } from "@/components/alerts/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { formatManilaDateTime } from "@/lib/datetime";
import { prisma } from "@/lib/db";

interface AlertDetailProps {
  params: Promise<{ id: string }>;
}

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="text-sm text-muted-foreground sm:w-32 sm:shrink-0">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** The details, affected zones, and resolve action for one alert. Render inside `<Suspense>`. */
export async function AlertDetail({ params }: AlertDetailProps) {
  const { id } = await params;
  await requireOfficer();

  const alert = await prisma.hazardAlert.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      hazardType: true,
      severity: true,
      officialLevel: true,
      description: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      zones: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });
  if (!alert) notFound();

  const isActive = alert.status === "ACTIVE";

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <HazardBadge type={alert.hazardType} className="text-base" />
          <Badge variant={isActive ? "outline" : "secondary"}>{isActive ? "Active" : "Resolved"}</Badge>
        </div>
        <h1 className="text-2xl font-semibold">{alert.title}</h1>
      </div>

      <Card>
        <CardContent>
          <dl className="flex flex-col gap-4">
            <DetailRow label="Severity">
              <SeverityBadge severity={alert.severity} />
            </DetailRow>
            <DetailRow label="Official level">
              {alert.officialLevel ?? <span className="text-muted-foreground">Not given</span>}
            </DetailRow>
            <DetailRow label="Logged">{formatManilaDateTime(alert.createdAt)}</DetailRow>
            {alert.resolvedAt && (
              <DetailRow label="Resolved">{formatManilaDateTime(alert.resolvedAt)}</DetailRow>
            )}
            {alert.description && (
              <DetailRow label="Description">
                <p className="whitespace-pre-wrap">{alert.description}</p>
              </DetailRow>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Affected zones</h2>
          </CardTitle>
          <CardDescription>
            {alert.zones.length === 0
              ? "The zones this alert named have since been deleted."
              : `${alert.zones.length} ${alert.zones.length === 1 ? "zone" : "zones"}`}
          </CardDescription>
        </CardHeader>
        {alert.zones.length > 0 && (
          <CardContent>
            <ul className="flex flex-col divide-y">
              {alert.zones.map((zone) => (
                <li key={zone.id}>
                  <Link
                    href={`/zones/${zone.id}`}
                    className="flex min-h-11 items-center py-2 font-medium hover:underline"
                  >
                    {zone.name}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Resolve</h2>
            </CardTitle>
            <CardDescription>
              Once the hazard has passed, mark the alert resolved. It moves to the Resolved tab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResolveAlertButton id={alert.id} />
          </CardContent>
        </Card>
      )}
    </>
  );
}

/** Placeholder while {@link AlertDetail} loads. */
export function AlertDetailSkeleton() {
  return (
    <>
      <Skeleton className="h-16 w-72" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </>
  );
}
