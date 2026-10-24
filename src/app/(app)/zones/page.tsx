import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PAGE_ACTION_CLASS, PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ZonesOverview, ZonesOverviewSkeleton } from "@/components/zones/zones-overview";

export const metadata: Metadata = {
  title: "Zones · Mi-isi Disaster Alert",
};

export default function ZonesPage() {
  return (
    <div className="w-full pb-8">
      <PageHeader
        eyebrow="Association records"
        title="Farm zones"
        description="Monitor zone conditions, coordinates, members, and active hazards."
        action={
          <Link href="/zones/new" className={buttonVariants({ className: PAGE_ACTION_CLASS })}>
            <Plus data-icon="inline-start" />
            Add zone
          </Link>
        }
      />

      <Suspense fallback={<ZonesOverviewSkeleton />}>
        <ZonesOverview />
      </Suspense>
    </div>
  );
}
