import { TemplateForm } from "@/components/templates/template-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { getEnv } from "@/lib/env";

/** The new-template form with the SMS prefix filled in. Render inside `<Suspense>`. */
export async function NewTemplateForm() {
  await requireOfficer();

  return (
    <Card>
      <CardContent>
        <TemplateForm prefix={getEnv().SMS_MESSAGE_PREFIX} />
      </CardContent>
    </Card>
  );
}

/** Placeholder while {@link NewTemplateForm} loads. */
export function NewTemplateFormSkeleton() {
  return <Skeleton className="h-160 rounded-xl" />;
}
