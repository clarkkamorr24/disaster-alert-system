import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteZoneButton } from "@/components/zones/delete-zone-button";
import { ZoneForm } from "@/components/zones/zone-form";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { formatPhoneForDisplay } from "@/lib/domain/phone";

interface ZoneDetailProps {
  params: Promise<{ id: string }>;
}

/** The edit form, members, and delete action for one zone. Render inside `<Suspense>`. */
export async function ZoneDetail({ params }: ZoneDetailProps) {
  const { id } = await params;
  await requireOfficer();

  const zone = await prisma.farmZone.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      latitude: true,
      longitude: true,
      members: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: { id: true, firstName: true, lastName: true, phone: true, isActive: true },
      },
    },
  });
  if (!zone) notFound();

  const { members, ...values } = zone;

  return (
    <>
      <h1 className="text-2xl font-semibold">{zone.name}</h1>

      <Card>
        <CardContent>
          {/* Keyed so a saved edit re-mounts the form with the new values. */}
          <ZoneForm
            key={`${values.name}|${values.description}|${values.latitude}|${values.longitude}`}
            zone={values}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Members</h2>
          </CardTitle>
          <CardDescription>
            {members.length === 0
              ? "No members live in this zone yet."
              : `${members.length} ${members.length === 1 ? "member lives" : "members live"} in this zone.`}
          </CardDescription>
        </CardHeader>
        {members.length > 0 && (
          <CardContent>
            <ul className="flex flex-col divide-y">
              {members.map((member) => (
                <li key={member.id}>
                  <Link
                    href={`/members/${member.id}`}
                    className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 hover:underline"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {member.firstName} {member.lastName}
                      {!member.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatPhoneForDisplay(member.phone)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Delete zone</h2>
          </CardTitle>
          <CardDescription>
            A zone can only be deleted once it has no members, active or inactive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteZoneButton id={zone.id} name={zone.name} />
        </CardContent>
      </Card>
    </>
  );
}

/** Placeholder while {@link ZoneDetail} loads. */
export function ZoneDetailSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </>
  );
}
