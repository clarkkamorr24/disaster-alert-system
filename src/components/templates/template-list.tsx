import { NewTemplateCard } from "@/components/templates/new-template-card";
import { PlaceholderBanner } from "@/components/templates/placeholder-banner";
import { TemplateCard } from "@/components/templates/template-card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";

const GRID_CLASS = "grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-3.5";

/** The placeholder banner and every template as a card, sorted by name, ending with the "create" card. Render inside `<Suspense>`. */
export async function TemplateList() {
  await requireOfficer();

  const templates = await prisma.messageTemplate.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      hazardType: true,
      body: true,
      _count: { select: { broadcasts: true } },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <PlaceholderBanner />
      <div className={GRID_CLASS}>
        {templates.map(({ _count, ...template }) => (
          <TemplateCard key={template.id} {...template} usageCount={_count.broadcasts} />
        ))}
        <NewTemplateCard />
      </div>
    </div>
  );
}

/** Placeholder while {@link TemplateList} loads. */
export function TemplateListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-[66px] rounded-[11px]" />
      <div className={GRID_CLASS}>
        <Skeleton className="h-[245px] rounded-xl" />
        <Skeleton className="h-[245px] rounded-xl" />
        <Skeleton className="h-[245px] rounded-xl" />
      </div>
    </div>
  );
}
