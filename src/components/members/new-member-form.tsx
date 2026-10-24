import Link from "next/link";

import { DetailCard } from "@/components/layout/detail-card";
import { MemberForm } from "@/components/members/member-form";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { getZoneOptions } from "@/lib/zone-options";

/** Shown instead of the member form when no zones exist yet. */
function AddZoneFirst() {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground">
        Members belong to a zone. Add a zone first, then come back to add members.
      </p>
      <Link href="/zones/new" className={buttonVariants({ className: "h-11 px-4 text-[13px]" })}>
        Add a zone first
      </Link>
    </div>
  );
}

/** The new-member form with the zone picker filled in. Render inside `<Suspense>`. */
export async function NewMemberForm() {
  await requireOfficer();
  const zones = await getZoneOptions();

  return (
    <DetailCard title="Member details">
      {zones.length === 0 ? <AddZoneFirst /> : <MemberForm zones={zones} />}
    </DetailCard>
  );
}

/** Placeholder while {@link NewMemberForm} loads. */
export function NewMemberFormSkeleton() {
  return <Skeleton className="h-136 rounded-xl" />;
}
