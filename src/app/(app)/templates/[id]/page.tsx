import type { Metadata } from "next";
import { Suspense } from "react";

import { BackToTemplates } from "@/components/templates/back-to-templates";
import { TemplateDetail, TemplateDetailSkeleton } from "@/components/templates/template-detail";

export const metadata: Metadata = {
  title: "Template · Mi-isi Disaster Alert",
};

export default function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <BackToTemplates />
      <Suspense fallback={<TemplateDetailSkeleton />}>
        <TemplateDetail params={params} />
      </Suspense>
    </div>
  );
}
