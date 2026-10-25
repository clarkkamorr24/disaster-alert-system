import type { Prisma } from "@/generated/prisma/client";
import { type PageSize, parsePageSize } from "@/lib/pagination";
import type { BroadcastKind, BroadcastListFilters } from "@/types/broadcast";

/** How many broadcasts the history shows per page. */
export const BROADCASTS_PER_PAGE: PageSize = 10;

const KINDS: readonly BroadcastKind[] = ["all", "alert", "announcement", "resend"];

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/**
 * Reads the broadcast history's search, kind, and page from URL search
 * params. Unknown or missing values fall back to the defaults: no search,
 * every kind, page 1.
 *
 * @param params - The awaited `searchParams` of `/broadcasts`.
 * @returns Filters that are always safe to query with.
 */
export function parseBroadcastListFilters(params: SearchParams): BroadcastListFilters {
  const kind = first(params.kind);
  const page = Number.parseInt(first(params.page), 10);
  return {
    q: first(params.q),
    kind: KINDS.includes(kind as BroadcastKind) ? (kind as BroadcastKind) : "all",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    size: parsePageSize(first(params.size), BROADCASTS_PER_PAGE),
  };
}

/**
 * Builds the Prisma filter for the broadcast history. A broadcast about an
 * alert that isn't a resend is `alert`, one with neither an alert nor an
 * original is `announcement`, and any resend is `resend`. The search matches
 * the message or the alert's title, case-insensitive.
 *
 * @param filters - Parsed with {@link parseBroadcastListFilters}.
 * @returns A `where` clause for `prisma.broadcast`.
 */
export function broadcastListWhere(filters: BroadcastListFilters): Prisma.BroadcastWhereInput {
  const where: Prisma.BroadcastWhereInput = {};
  if (filters.kind === "alert") {
    where.alertId = { not: null };
    where.retryOfId = null;
  } else if (filters.kind === "announcement") {
    where.alertId = null;
    where.retryOfId = null;
  } else if (filters.kind === "resend") {
    where.retryOfId = { not: null };
  }

  if (filters.q) {
    where.OR = [
      { content: { contains: filters.q, mode: "insensitive" } },
      { alert: { title: { contains: filters.q, mode: "insensitive" } } },
    ];
  }
  return where;
}

/**
 * Builds a `/broadcasts` URL for the given filters, leaving out defaults so
 * links stay short.
 *
 * @param filters - The filters to keep.
 * @param page - The page to link to; defaults to `filters.page`.
 * @returns A path such as `/broadcasts?q=lahar&kind=resend&page=2`.
 */
export function broadcastListHref(filters: BroadcastListFilters, page = filters.page): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.kind !== "all") params.set("kind", filters.kind);
  if (filters.size !== BROADCASTS_PER_PAGE) params.set("size", String(filters.size));
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/broadcasts?${query}` : "/broadcasts";
}
