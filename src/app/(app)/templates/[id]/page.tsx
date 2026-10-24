import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink } from "@/components/layout/back-link";
import { TemplateDetail, TemplateDetailSkeleton } from "@/components/templates/template-detail";

export const metadata: Metadata = {
  title: "Template · Mi-isi Disaster Alert",
};

export default function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex w-full flex-col pb-8">
      <div className="pt-[22px]">
        <BackLink href="/templates" label="Message templates" />
      </div>
      <Suspense fallback={<TemplateDetailSkeleton />}>
        <TemplateDetail params={params} />
      </Suspense>
    </div>
  );
}
