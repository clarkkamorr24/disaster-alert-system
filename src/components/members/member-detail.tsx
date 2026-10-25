import { Check } from "lucide-react";
import { notFound } from "next/navigation";
import { cn } from "cn";

import { DetailCard } from "@/components/layout/detail-card";
import { DeleteMemberButton } from "@/components/members/delete-member-button";
import { MemberForm } from "@/components/members/member-form";
import { MemberStatusButton } from "@/components/members/member-status-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { formatManilaDate } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import { initialsOf } from "@/lib/initials";
import { getZoneOptions } from "@/lib/zone-options";

interface MemberDetailProps {
  params: Promise<{ id: string }>;
}

/** The header, edit form, status, and delete action for one member. Render inside `<Suspense>`. */
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
      <header className="flex items-start gap-3.5 rounded-xl border bg-card p-5">
        <Avatar className="size-11 after:hidden" aria-hidden="true">
          <AvatarFallback className="bg-avatar text-xs font-bold text-avatar-foreground">
            {initialsOf(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[13px] font-bold tracking-[.08em] text-muted-foreground uppercase">Member</p>
          <h1 className="font-heading text-[22px] leading-tight font-bold tracking-[-0.03em]">{name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[13px] font-semibold",
                isActive ? "text-status-clear" : "text-status-neutral",
              )}
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {isActive ? "Active" : "Inactive"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Check className="size-3.5 text-status-clear" strokeWidth={2} aria-hidden="true" />
              Consent recorded on {formatManilaDate(consentAt)}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <DetailCard title="Member details">
          {/* Keyed so a saved edit re-mounts the form with the new values. */}
          <MemberForm key={Object.values(values).join("|")} zones={zones} member={values} />
        </DetailCard>

        <DetailCard title="Status and removal">
          <div className="flex flex-col items-start gap-3">
            <p className="text-[13px] text-muted-foreground">
              {isActive
                ? "Inactive members receive no SMS. Their details and delivery history are kept."
                : "This member is inactive and receives no SMS."}
            </p>
            <MemberStatusButton id={member.id} name={name} isActive={isActive} />
          </div>
          <Separator />
          <div className="flex flex-col items-start gap-3">
            <p className="text-[13px] text-muted-foreground">
              Delete permanently only when the member asks to be removed under the Data Privacy Act (RA 10173).
            </p>
            <DeleteMemberButton id={member.id} name={name} />
          </div>
        </DetailCard>
      </div>
    </>
  );
}

/** Placeholder while {@link MemberDetail} loads. */
export function MemberDetailSkeleton() {
  return (
    <>
      <Skeleton className="h-[118px] rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Skeleton className="h-[560px] rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    </>
  );
}
