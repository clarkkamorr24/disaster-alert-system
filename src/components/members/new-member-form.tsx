import Link from "next/link";

import { MemberForm } from "@/components/members/member-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <Link href="/zones/new" className={buttonVariants({ className: "h-11 px-4 text-base" })}>
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
    <Card>
      <CardContent>{zones.length === 0 ? <AddZoneFirst /> : <MemberForm zones={zones} />}</CardContent>
    </Card>
  );
}

/** Placeholder while {@link NewMemberForm} loads. */
export function NewMemberFormSkeleton() {
  return <Skeleton className="h-136 rounded-xl" />;
}
