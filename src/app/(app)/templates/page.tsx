import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { TemplateList, TemplateListSkeleton } from "@/components/templates/template-list";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Templates · Mi-isi Disaster Alert",
};

export default function TemplatesPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <Link href="/templates/new" className={buttonVariants({ className: "h-11 px-4 text-base" })}>
          <Plus data-icon="inline-start" />
          New template
        </Link>
      </div>

      <Suspense fallback={<TemplateListSkeleton />}>
        <TemplateList />
      </Suspense>
    </div>
  );
}
