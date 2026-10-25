import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { NewZoneForm, NewZoneFormSkeleton } from "@/components/zones/new-zone-form";

export const metadata: Metadata = {
  title: "New zone · Mi-isi Disaster Alert",
};

export default function NewZonePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col pb-8">
      <div className="pt-[22px]">
        <BackLink href="/zones" label="Farm zones" />
      </div>
      <PageHeader
        eyebrow="Association records"
        title="Add zone"
        description="Name the purok or sitio, set its center, and draw its boundary on the map."
      />
      <Suspense fallback={<NewZoneFormSkeleton />}>
        <NewZoneForm />
      </Suspense>
    </div>
  );
}
