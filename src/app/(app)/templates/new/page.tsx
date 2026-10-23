import type { Metadata } from "next";
import { Suspense } from "react";

import { BackToTemplates } from "@/components/templates/back-to-templates";
import { NewTemplateForm, NewTemplateFormSkeleton } from "@/components/templates/new-template-form";

export const metadata: Metadata = {
  title: "New template · Mi-isi Disaster Alert",
};

export default function NewTemplatePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackToTemplates />
        <h1 className="text-2xl font-semibold">New template</h1>
      </div>
      <Suspense fallback={<NewTemplateFormSkeleton />}>
        <NewTemplateForm />
      </Suspense>
    </div>
  );
}
