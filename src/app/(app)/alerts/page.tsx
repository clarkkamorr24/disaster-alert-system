import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AlertList, AlertListSkeleton } from "@/components/alerts/alert-list";
import { PAGE_ACTION_CLASS, PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Alerts · Mi-isi Disaster Alert",
};

export default function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Association records"
        title="Hazard alerts"
        description="Log, monitor, and resolve hazards affecting your farm zones."
        action={
          <Link href="/alerts/new" className={buttonVariants({ className: PAGE_ACTION_CLASS })}>
            <Plus data-icon="inline-start" />
            New alert
          </Link>
        }
      />

      <Suspense fallback={<AlertListSkeleton />}>
        <AlertList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
