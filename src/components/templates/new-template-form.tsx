import { TemplateForm } from "@/components/templates/template-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { getEnv } from "@/lib/env";

/** The new-template form with the SMS prefix filled in. Render inside `<Suspense>`. */
export async function NewTemplateForm() {
  await requireOfficer();

  const { SMS_MESSAGE_PREFIX, UNISMS_SENDER_ID } = getEnv();
  return <TemplateForm prefix={SMS_MESSAGE_PREFIX} senderId={UNISMS_SENDER_ID} />;
}

/** Placeholder while {@link NewTemplateForm} loads: the form card and the preview card. */
export function NewTemplateFormSkeleton() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Skeleton className="h-[560px] flex-[3_1_440px] rounded-xl" />
      <Skeleton className="h-60 flex-[2_1_300px] rounded-xl" />
    </div>
  );
}
