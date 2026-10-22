import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { ZoneList, ZoneListSkeleton } from "@/components/zones/zone-list";

export const metadata: Metadata = {
  title: "Zones · Mi-isi Disaster Alert",
};

export default function ZonesPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Zones</h1>
        <Link href="/zones/new" className={buttonVariants({ className: "h-11 px-4 text-base" })}>
          <Plus data-icon="inline-start" />
          New zone
        </Link>
      </div>

      <Suspense fallback={<ZoneListSkeleton />}>
        <ZoneList />
      </Suspense>
    </div>
  );
}
