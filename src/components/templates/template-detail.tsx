import { notFound } from "next/navigation";

import { DeleteTemplateButton } from "@/components/templates/delete-template-button";
import { TemplateForm } from "@/components/templates/template-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";

interface TemplateDetailProps {
  params: Promise<{ id: string }>;
}

/** The edit form and delete action for one template. Render inside `<Suspense>`. */
export async function TemplateDetail({ params }: TemplateDetailProps) {
  const { id } = await params;
  await requireOfficer();

  const template = await prisma.messageTemplate.findUnique({
    where: { id },
    select: { id: true, name: true, hazardType: true, body: true },
  });
  if (!template) notFound();

  return (
    <>
      <h1 className="text-2xl font-semibold">{template.name}</h1>

      <Card>
        <CardContent>
          {/* Keyed so a saved edit re-mounts the form with the new values. */}
          <TemplateForm
            key={`${template.name}|${template.hazardType}|${template.body}`}
            prefix={getEnv().SMS_MESSAGE_PREFIX}
            template={template}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Delete template</h2>
          </CardTitle>
          <CardDescription>Messages already sent with this template are not affected.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteTemplateButton id={template.id} name={template.name} />
        </CardContent>
      </Card>
    </>
  );
}

/** Placeholder while {@link TemplateDetail} loads. */
export function TemplateDetailSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-160 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </>
  );
}
