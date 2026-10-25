import { Severity } from "@/generated/prisma/enums";
import type { ZoneListFilters, ZoneListStatus, ZoneMapPoint, ZoneView } from "@/types/zone";

const STATUSES: readonly ZoneListStatus[] = [...Object.values(Severity), "CLEAR"];
const VIEWS: readonly ZoneView[] = ["card", "list"];

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function oneOf<T extends string>(value: string, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/**
 * Reads the zones page's search, status filter, and view from URL search
 * params. Unknown or missing values fall back to no search, every status, and
 * the card view.
 *
 * @param params - The awaited `searchParams` of `/zones`.
 * @returns Filters that are always safe to apply.
 */
export function parseZoneListFilters(params: SearchParams): ZoneListFilters {
  return {
    q: first(params.q),
    status: oneOf(first(params.status), STATUSES),
    view: oneOf(first(params.view), VIEWS) ?? "card",
  };
}

/**
 * Keeps the zones whose name contains the search (case-insensitive) and whose
 * worst active severity matches the status filter (`CLEAR` = no active alert).
 *
 * @param zones - Every zone, in display order.
 * @param filters - Parsed with {@link parseZoneListFilters}.
 * @returns The matching zones, in the same order.
 */
export function filterZones(zones: ZoneMapPoint[], filters: ZoneListFilters): ZoneMapPoint[] {
  const needle = filters.q.toLowerCase();
  return zones.filter(
    (zone) =>
      (needle === "" || zone.name.toLowerCase().includes(needle)) &&
      (filters.status === null || (zone.worstSeverity ?? "CLEAR") === filters.status),
  );
}

/**
 * Builds a `/zones` URL for the given filters, leaving out defaults so links
 * stay short.
 *
 * @param filters - The filters to keep.
 * @returns A path such as `/zones?q=purok&status=CRITICAL&view=list`.
 */
export function zoneListHref(filters: ZoneListFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.view !== "card") params.set("view", filters.view);
  const query = params.toString();
  return query ? `/zones?${query}` : "/zones";
}
