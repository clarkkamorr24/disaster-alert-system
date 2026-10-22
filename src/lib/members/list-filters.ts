import type { Prisma } from "@/generated/prisma/client";
import type { MemberListFilters, MemberStatusFilter } from "@/types/member";

/** How many members the list shows per page. */
export const MEMBERS_PER_PAGE = 50;

const STATUSES: readonly MemberStatusFilter[] = ["active", "inactive", "all"];

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/**
 * Reads the member list's filters from URL search params. Unknown or missing
 * values fall back to the defaults: no search, all zones, active members, page 1.
 *
 * @param params - The awaited `searchParams` of `/members`.
 * @returns Filters that are always safe to query with.
 */
export function parseMemberListFilters(params: SearchParams): MemberListFilters {
  const status = first(params.status) as MemberStatusFilter;
  const page = Number.parseInt(first(params.page), 10);
  return {
    q: first(params.q),
    zoneId: first(params.zone) || undefined,
    status: STATUSES.includes(status) ? status : "active",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/**
 * Reduces a search to the digits that can appear in a stored `+639…` number:
 * `0917 123` becomes `917123`, `+63 917` becomes `917`.
 *
 * @returns The digits to look for, or `undefined` when the search has none.
 */
function phoneDigits(q: string): string | undefined {
  const digits = q.replace(/\D/g, "");
  if (digits === "") return undefined;
  const local = digits.replace(/^(?:63|0)/, "");
  return local === "" ? digits : local;
}

/**
 * Builds the Prisma filter for the member list.
 *
 * Every word of the search must match a first or last name (case-insensitive).
 * When the search contains digits, a member whose phone contains those digits
 * also matches, so `0917 123` finds `+63917123…`.
 *
 * @param filters - Parsed with {@link parseMemberListFilters}.
 * @returns A `where` clause for `prisma.member`.
 */
export function memberListWhere(filters: MemberListFilters): Prisma.MemberWhereInput {
  const where: Prisma.MemberWhereInput = {};
  if (filters.zoneId) where.zoneId = filters.zoneId;
  if (filters.status !== "all") where.isActive = filters.status === "active";

  const words = filters.q.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const nameMatch: Prisma.MemberWhereInput = {
      AND: words.map((word) => ({
        OR: [
          { firstName: { contains: word, mode: "insensitive" } },
          { lastName: { contains: word, mode: "insensitive" } },
        ],
      })),
    };
    const digits = phoneDigits(filters.q);
    where.OR = digits ? [nameMatch, { phone: { contains: digits } }] : [nameMatch];
  }

  return where;
}

/**
 * Builds a `/members` URL for the given filters, leaving out defaults so
 * links stay short.
 *
 * @param filters - The filters to keep.
 * @param page - The page to link to; defaults to `filters.page`.
 * @returns A path such as `/members?q=juan&status=all&page=2`.
 */
export function memberListHref(filters: MemberListFilters, page = filters.page): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.zoneId) params.set("zone", filters.zoneId);
  if (filters.status !== "active") params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/members?${query}` : "/members";
}
