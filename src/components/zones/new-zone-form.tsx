import { DetailCard } from "@/components/layout/detail-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ZoneForm } from "@/components/zones/zone-form";
import { requireOfficer } from "@/lib/auth/dal";
import { getDefaultZoneColor } from "@/lib/zones/colors";

/** The new-zone form, starting on the first color no other zone uses. Render inside `<Suspense>`. */
export async function NewZoneForm() {
  await requireOfficer();
  const defaultColor = await getDefaultZoneColor();

  return (
    <DetailCard title="Zone details">
      <ZoneForm defaultColor={defaultColor} />
    </DetailCard>
  );
}

/** Placeholder while {@link NewZoneForm} loads. */
export function NewZoneFormSkeleton() {
  return <Skeleton className="h-136 rounded-xl" />;
}
