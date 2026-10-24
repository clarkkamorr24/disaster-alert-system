import { Download } from "lucide-react";
import type { Metadata } from "next";

import { BackLink } from "@/components/layout/back-link";
import { DetailCard } from "@/components/layout/detail-card";
import { PageHeader } from "@/components/layout/page-header";
import { ImportForm } from "@/components/members/import-form";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Import members · Mi-isi Disaster Alert",
};

export default function ImportMembersPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col pb-8">
      <div className="pt-[22px]">
        <BackLink href="/members" label="Members" />
      </div>
      <PageHeader
        eyebrow="Association records"
        title="Import members"
        description="Add many members at once from a filled-in CSV template."
        action={
          <a
            href="/downloads/members-template.csv"
            download
            className={buttonVariants({ variant: "outline", className: "h-11 gap-2 px-4 text-[13px]" })}
          >
            <Download data-icon="inline-start" />
            Download the CSV template
          </a>
        }
      />
      <DetailCard
        title="Upload a CSV file"
        description="One member per row. Zone names must match a zone under Zones. Rows with problems are listed so you can fix them; only new numbers are added."
      >
        <ImportForm />
      </DetailCard>
    </div>
  );
}
