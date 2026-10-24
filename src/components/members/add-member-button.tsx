import { UserPlus } from "lucide-react";
import Link from "next/link";

import { PAGE_ACTION_CLASS } from "@/components/layout/page-header";
import { AddMemberDialog } from "@/components/members/add-member-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { requireOfficer } from "@/lib/auth/dal";
import { getZoneOptions } from "@/lib/zone-options";

/**
 * The members page's Add member button: opens the pop-up, or links to
 * `/members/new` (which asks for a zone first) when no zones exist. Render inside `<Suspense>`.
 */
export async function AddMemberButton() {
  await requireOfficer();
  const zones = await getZoneOptions();

  if (zones.length === 0) {
    return (
      <Link href="/members/new" className={buttonVariants({ className: PAGE_ACTION_CLASS })}>
        <UserPlus data-icon="inline-start" />
        Add member
      </Link>
    );
  }
  return <AddMemberDialog zones={zones} />;
}

/** The button while {@link AddMemberButton} loads the zones. */
export function AddMemberButtonFallback() {
  return (
    <Button className={PAGE_ACTION_CLASS} disabled>
      <UserPlus data-icon="inline-start" />
      Add member
    </Button>
  );
}
