import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PAGE_ACTION_CLASS, PageHeader } from "@/components/layout/page-header";
import { TemplateList, TemplateListSkeleton } from "@/components/templates/template-list";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Templates · Mi-isi Disaster Alert",
};

export default function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="w-full pb-8">
      <PageHeader
        eyebrow="Association records"
        title="Message templates"
        description="Create reusable messages for faster, consistent emergency broadcasts."
        action={
          <Link href="/templates/new" className={buttonVariants({ className: PAGE_ACTION_CLASS })}>
            <Plus data-icon="inline-start" />
            New template
          </Link>
        }
      />

      <Suspense fallback={<TemplateListSkeleton />}>
        <TemplateList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
