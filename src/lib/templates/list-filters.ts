import { HazardType } from "@/generated/prisma/enums";
import type {
  TemplateHazardFilter,
  TemplateListFilters,
  TemplateUsageFilter,
  TemplateView,
} from "@/types/template";

const HAZARDS: readonly TemplateHazardFilter[] = [...Object.values(HazardType), "ANY"];
const USAGES: readonly TemplateUsageFilter[] = ["used", "unused"];
const VIEWS: readonly TemplateView[] = ["card", "list"];

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function oneOf<T extends string>(value: string, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/**
 * Reads the templates page's search, hazard and usage filters, and view from
 * URL search params. Unknown or missing values fall back to no search, every
 * template, and the card view.
 *
 * @param params - The awaited `searchParams` of `/templates`.
 * @returns Filters that are always safe to apply.
 */
export function parseTemplateListFilters(params: SearchParams): TemplateListFilters {
  return {
    q: first(params.q),
    hazard: oneOf(first(params.hazard), HAZARDS),
    usage: oneOf(first(params.usage), USAGES),
    view: oneOf(first(params.view), VIEWS) ?? "card",
  };
}

/** The fields {@link filterTemplates} reads. */
interface FilterableTemplate {
  name: string;
  body: string;
  hazardType: HazardType | null;
  usageCount: number;
}

/**
 * Keeps the templates whose name or message contains the search
 * (case-insensitive) and that match the hazard (`ANY` = no hazard set) and
 * usage filters.
 *
 * @param templates - Every template, in display order.
 * @param filters - Parsed with {@link parseTemplateListFilters}.
 * @returns The matching templates, in the same order.
 */
export function filterTemplates<T extends FilterableTemplate>(templates: T[], filters: TemplateListFilters): T[] {
  const needle = filters.q.toLowerCase();
  return templates.filter(
    (template) =>
      (needle === "" ||
        template.name.toLowerCase().includes(needle) ||
        template.body.toLowerCase().includes(needle)) &&
      (filters.hazard === null || (template.hazardType ?? "ANY") === filters.hazard) &&
      (filters.usage === null || (template.usageCount > 0) === (filters.usage === "used")),
  );
}

/**
 * Builds a `/templates` URL for the given filters, leaving out defaults so
 * links stay short.
 *
 * @param filters - The filters to keep.
 * @returns A path such as `/templates?q=ashfall&hazard=ANY&usage=used&view=list`.
 */
export function templateListHref(filters: TemplateListFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.hazard) params.set("hazard", filters.hazard);
  if (filters.usage) params.set("usage", filters.usage);
  if (filters.view !== "card") params.set("view", filters.view);
  const query = params.toString();
  return query ? `/templates?${query}` : "/templates";
}
