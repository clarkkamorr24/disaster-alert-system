import { notFound } from "next/navigation";

import { DetailCard } from "@/components/layout/detail-card";
import { PageHeader } from "@/components/layout/page-header";
import { DeleteTemplateButton } from "@/components/templates/delete-template-button";
import { NewTemplateFormSkeleton } from "@/components/templates/new-template-form";
import { TemplateForm } from "@/components/templates/template-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { usageLabel } from "@/lib/templates/usage";

interface TemplateDetailProps {
  params: Promise<{ id: string }>;
}

/** The header with usage, the edit form, and the delete action for one template. Render inside `<Suspense>`. */
export async function TemplateDetail({ params }: TemplateDetailProps) {
  const { id } = await params;
  await requireOfficer();

  const template = await prisma.messageTemplate.findUnique({
    where: { id },
    select: { id: true, name: true, hazardType: true, body: true, _count: { select: { broadcasts: true } } },
  });
  if (!template) notFound();

  const { _count, ...values } = template;

  return (
    <>
      <PageHeader eyebrow="Association records" title={template.name} description={usageLabel(_count.broadcasts)} />

      <div className="flex flex-col gap-4">
        {/* Keyed so a saved edit re-mounts the form with the new values. */}
        <TemplateForm
          key={`${values.name}|${values.hazardType}|${values.body}`}
          prefix={getEnv().SMS_MESSAGE_PREFIX}
          template={values}
        />

        <DetailCard
          title="Delete template"
          description="Messages already sent with this template are not affected."
          className="items-start"
        >
          <DeleteTemplateButton id={template.id} name={template.name} />
        </DetailCard>
      </div>
    </>
  );
}

/** Placeholder while {@link TemplateDetail} loads. */
export function TemplateDetailSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2 pt-[30px] pb-6">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex flex-col gap-4">
        <NewTemplateFormSkeleton />
        <Skeleton className="h-[122px] rounded-xl" />
      </div>
    </>
  );
}
