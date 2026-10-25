import { SearchX } from "lucide-react";
import Link from "next/link";

import { ViewToggle } from "@/components/layout/segmented-control";
import { SearchField, TableToolbar } from "@/components/layout/table-toolbar";
import { NewTemplateCard } from "@/components/templates/new-template-card";
import { PlaceholderBanner } from "@/components/templates/placeholder-banner";
import { TemplateCard } from "@/components/templates/template-card";
import { TemplateFilters } from "@/components/templates/template-filters";
import { TemplateTable } from "@/components/templates/template-table";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { filterTemplates, parseTemplateListFilters, templateListHref } from "@/lib/templates/list-filters";

const GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-3.5 p-4";

interface TemplateListProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The placeholder banner, then a card with search, hazard and usage filters,
 * and the Card / List view toggle over the matching templates (sorted by
 * name; the card view ends with the "create" card). Render inside `<Suspense>`.
 */
export async function TemplateList({ searchParams }: TemplateListProps) {
  const filters = parseTemplateListFilters(await searchParams);
  await requireOfficer();

  const rows = await prisma.messageTemplate.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      hazardType: true,
      body: true,
      _count: { select: { broadcasts: true } },
    },
  });
  const templates = rows.map(({ _count, ...template }) => ({ ...template, usageCount: _count.broadcasts }));
  const shown = filterTemplates(templates, filters);
  const filtered = filters.q !== "" || filters.hazard !== null || filters.usage !== null;

  return (
    <div className="flex flex-col gap-4">
      <PlaceholderBanner />
      <section aria-label="Template list" className="overflow-hidden rounded-xl border bg-card">
        <TableToolbar>
          <SearchField
            action="/templates"
            label="Search templates"
            placeholder="Search name or message…"
            defaultValue={filters.q}
            keep={{ hazard: filters.hazard, usage: filters.usage, view: filters.view === "card" ? null : filters.view }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <TemplateFilters filters={filters} />
            <ViewToggle
              label="Template view"
              view={filters.view}
              hrefs={{
                card: templateListHref({ ...filters, view: "card" }),
                list: templateListHref({ ...filters, view: "list" }),
              }}
            />
          </div>
        </TableToolbar>
        {shown.length === 0 && filtered ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <SearchX className="size-6 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No templates match these filters.</p>
            <Link
              href={templateListHref({ q: "", hazard: null, usage: null, view: filters.view })}
              scroll={false}
              className="inline-flex min-h-11 items-center text-xs font-bold text-link hover:text-primary-hover"
            >
              Clear filters
            </Link>
          </div>
        ) : filters.view === "list" && shown.length > 0 ? (
          <TemplateTable templates={shown} />
        ) : (
          <div className={GRID_CLASS}>
            {shown.map((template) => (
              <TemplateCard key={template.id} {...template} />
            ))}
            <NewTemplateCard />
          </div>
        )}
      </section>
    </div>
  );
}

/** Placeholder while {@link TemplateList} loads. */
export function TemplateListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-[66px] rounded-[11px]" />
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="h-[65px] border-b" />
        <div className={GRID_CLASS}>
          <Skeleton className="h-[245px] rounded-xl" />
          <Skeleton className="h-[245px] rounded-xl" />
          <Skeleton className="h-[245px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
