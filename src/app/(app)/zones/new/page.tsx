import type { Metadata } from "next";

import { BackLink } from "@/components/layout/back-link";
import { DetailCard } from "@/components/layout/detail-card";
import { PageHeader } from "@/components/layout/page-header";
import { ZoneForm } from "@/components/zones/zone-form";

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
        description="Name the purok or sitio and set its center on the map."
      />
      <DetailCard title="Zone details">
        <ZoneForm />
      </DetailCard>
    </div>
  );
}
