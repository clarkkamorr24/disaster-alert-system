import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { NewTemplateForm, NewTemplateFormSkeleton } from "@/components/templates/new-template-form";

export const metadata: Metadata = {
  title: "New template · Mi-isi Disaster Alert",
};

export default function NewTemplatePage() {
  return (
    <div className="flex w-full flex-col pb-8">
      <div className="pt-[22px]">
        <BackLink href="/templates" label="Message templates" />
      </div>
      <PageHeader
        eyebrow="Association records"
        title="New template"
        description="Write a reusable message. Placeholders are filled in when you send."
      />
      <Suspense fallback={<NewTemplateFormSkeleton />}>
        <NewTemplateForm />
      </Suspense>
    </div>
  );
}
