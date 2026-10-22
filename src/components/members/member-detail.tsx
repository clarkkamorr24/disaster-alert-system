import { notFound } from "next/navigation";

import { DeleteMemberButton } from "@/components/members/delete-member-button";
import { MemberForm } from "@/components/members/member-form";
import { MemberStatusButton } from "@/components/members/member-status-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { formatManilaDate } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import { getZoneOptions } from "@/lib/zone-options";

interface MemberDetailProps {
  params: Promise<{ id: string }>;
}

/** The edit form, status, and delete action for one member. Render inside `<Suspense>`. */
export async function MemberDetail({ params }: MemberDetailProps) {
  const { id } = await params;
  await requireOfficer();

  const [member, zones] = await Promise.all([
    prisma.member.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        zoneId: true,
        crops: true,
        notes: true,
        isActive: true,
        consentAt: true,
      },
    }),
    getZoneOptions(),
  ]);
  if (!member) notFound();

  const { isActive, consentAt, ...values } = member;
  const name = `${member.firstName} ${member.lastName}`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{name}</h1>
        <Badge variant={isActive ? "outline" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
      </div>

      <Card>
        <CardContent>
          {/* Keyed so a saved edit re-mounts the form with the new values. */}
          <MemberForm
            key={Object.values(values).join("|")}
            zones={zones}
            member={values}
            consentRecordedOn={formatManilaDate(consentAt)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">{isActive ? "Deactivate" : "Reactivate"}</h2>
          </CardTitle>
          <CardDescription>
            {isActive
              ? "Inactive members receive no SMS. Their details and delivery history are kept."
              : "This member is inactive and receives no SMS."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberStatusButton id={member.id} name={name} isActive={isActive} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Delete permanently</h2>
          </CardTitle>
          <CardDescription>
            For members who ask to be removed under the Data Privacy Act (RA 10173).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteMemberButton id={member.id} name={name} />
        </CardContent>
      </Card>
    </>
  );
}

/** Placeholder while {@link MemberDetail} loads. */
export function MemberDetailSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-120 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </>
  );
}
