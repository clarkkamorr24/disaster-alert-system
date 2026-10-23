import type { Prisma } from "@/generated/prisma/client";
import { HazardType, Severity } from "@/generated/prisma/enums";
import { HAZARD_TYPES } from "@/lib/domain/hazards";
import type { AlertListFilters, AlertTab } from "@/types/alert";

/** How many alerts the log shows per page. */
export const ALERTS_PER_PAGE = 25;

const TABS: readonly AlertTab[] = ["all", "active", "resolved"];

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function oneOf<T extends string>(value: string, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/**
 * Reads the alert log's tab, search, filters, and page from URL search
 * params. Unknown or missing values fall back to the defaults: the Active
 * tab, no search, every hazard and severity, page 1.
 *
 * @param params - The awaited `searchParams` of `/alerts`.
 * @returns Filters that are always safe to query with.
 */
export function parseAlertListFilters(params: SearchParams): AlertListFilters {
  const page = Number.parseInt(first(params.page), 10);
  return {
    tab: oneOf(first(params.tab), TABS) ?? "active",
    q: first(params.q),
    hazard: oneOf(first(params.hazard), Object.values(HazardType)),
    severity: oneOf(first(params.severity), Object.values(Severity)),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/**
 * Lists the hazard types whose label contains the search, so `ash` finds
 * Ashfall alerts.
 *
 * @param q - The search, in any case.
 * @returns Matching hazard types, in enum order.
 */
function hazardsMatching(q: string): HazardType[] {
  const needle = q.toLowerCase();
  return Object.values(HazardType).filter((type) => HAZARD_TYPES[type].label.toLowerCase().includes(needle));
}

/**
 * Builds the Prisma filter for the alert log. The tab is left out when
 * `includeTab` is false, so the same search and filters can count every tab.
 *
 * The search matches the title or official level (case-insensitive), or the
 * hazard type's label.
 *
 * @param filters - Parsed with {@link parseAlertListFilters}.
 * @param includeTab - Whether to filter by the tab's status.
 * @returns A `where` clause for `prisma.hazardAlert`.
 */
export function alertListWhere(filters: AlertListFilters, includeTab = true): Prisma.HazardAlertWhereInput {
  const where: Prisma.HazardAlertWhereInput = {};
  if (includeTab && filters.tab !== "all") where.status = filters.tab === "active" ? "ACTIVE" : "RESOLVED";
  if (filters.hazard) where.hazardType = filters.hazard;
  if (filters.severity) where.severity = filters.severity;

  if (filters.q) {
    const hazards = hazardsMatching(filters.q);
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { officialLevel: { contains: filters.q, mode: "insensitive" } },
      ...(hazards.length > 0 ? [{ hazardType: { in: hazards } }] : []),
    ];
  }

  return where;
}

/**
 * Builds an `/alerts` URL for the given filters, leaving out defaults so
 * links stay short.
 *
 * @param filters - The filters to keep.
 * @param page - The page to link to; defaults to `filters.page`.
 * @returns A path such as `/alerts?tab=all&q=mayon&page=2`.
 */
export function alertListHref(filters: AlertListFilters, page = filters.page): string {
  const params = new URLSearchParams();
  if (filters.tab !== "active") params.set("tab", filters.tab);
  if (filters.q) params.set("q", filters.q);
  if (filters.hazard) params.set("hazard", filters.hazard);
  if (filters.severity) params.set("severity", filters.severity);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/alerts?${query}` : "/alerts";
}
