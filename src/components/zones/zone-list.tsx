import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";

function memberLabel(count: number): string {
  return `${count} active ${count === 1 ? "member" : "members"}`;
}

/** Every zone with its active member count: a table from `md` up, cards below. Render inside `<Suspense>`. */
export async function ZoneList() {
  await requireOfficer();

  const zones = await prisma.farmZone.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      _count: { select: { members: { where: { isActive: true } } } },
    },
  });

  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
        <MapPin className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">No zones yet. Add the first purok or sitio.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden rounded-xl border md:block">
        <Table className="text-base">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Coordinates</TableHead>
              <TableHead className="px-4 text-right">Active members</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="px-4 py-3">
                  <Link href={`/zones/${zone.id}`} className="font-medium text-primary hover:underline">
                    {zone.name}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3 tabular-nums text-muted-foreground">
                  {zone.latitude}, {zone.longitude}
                </TableCell>
                <TableCell className="px-4 py-3 text-right tabular-nums">
                  {zone._count.members}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {zones.map((zone) => (
          <li key={zone.id}>
            <Link
              href={`/zones/${zone.id}`}
              className="flex min-h-11 items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:bg-muted"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-medium">{zone.name}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {zone.latitude}, {zone.longitude}
                </span>
                <span className="text-sm">{memberLabel(zone._count.members)}</span>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Placeholder while {@link ZoneList} loads. */
export function ZoneListSkeleton() {
  return <Skeleton className="h-48 rounded-xl" />;
}
