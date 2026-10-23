import Link from "next/link";

import { AlertForm } from "@/components/alerts/alert-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { getZoneOptions } from "@/lib/zone-options";

/** Shown instead of the alert form when no zones exist yet. */
function AddZoneFirst() {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground">
        Alerts name the zones they affect. Add a zone first, then come back to log the alert.
      </p>
      <Link href="/zones/new" className={buttonVariants({ className: "h-11 px-4 text-base" })}>
        Add a zone first
      </Link>
    </div>
  );
}

/** The new-alert form with the zone checkboxes filled in. Render inside `<Suspense>`. */
export async function NewAlertForm() {
  await requireOfficer();
  const zones = await getZoneOptions();

  return (
    <Card>
      <CardContent>{zones.length === 0 ? <AddZoneFirst /> : <AlertForm zones={zones} />}</CardContent>
    </Card>
  );
}

/** Placeholder while {@link NewAlertForm} loads. */
export function NewAlertFormSkeleton() {
  return <Skeleton className="h-160 rounded-xl" />;
}
