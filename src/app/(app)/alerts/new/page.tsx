import type { Metadata } from "next";
import { Suspense } from "react";

import { NewAlert, NewAlertSkeleton } from "@/components/alerts/new-alert";
import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "New alert · Mi-isi Disaster Alert",
};

export default function NewAlertPage() {
  return (
    <div className="flex w-full flex-col pb-8">
      <div className="pt-[22px]">
        <BackLink href="/alerts" label="Hazard alerts" />
      </div>
      <PageHeader
        eyebrow="Association records"
        title="New alert"
        description="Write the alert and pick the zones. You confirm the recipients before anything is sent."
      />
      <Suspense fallback={<NewAlertSkeleton />}>
        <NewAlert />
      </Suspense>
    </div>
  );
}
