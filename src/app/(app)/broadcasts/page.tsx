import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BroadcastList, BroadcastListSkeleton } from "@/components/broadcast/broadcast-list";
import { PAGE_ACTION_CLASS, PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Broadcasts · Mi-isi Disaster Alert",
};

export default function BroadcastsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        eyebrow="Association records"
        title="Broadcasts"
        description="Compose SMS warnings and review delivery to every member."
        action={
          <Link href="/broadcasts/new" className={buttonVariants({ className: PAGE_ACTION_CLASS })}>
            <Plus data-icon="inline-start" />
            New broadcast
          </Link>
        }
      />

      <Suspense fallback={<BroadcastListSkeleton />}>
        <BroadcastList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
