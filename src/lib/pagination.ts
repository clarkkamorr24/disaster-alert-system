/** The rows-per-page choices every paginated table offers. */
export const PAGE_SIZES = [10, 25, 50, 100] as const;

/** One of {@link PAGE_SIZES}. */
export type PageSize = (typeof PAGE_SIZES)[number];

/**
 * Reads a `size` search param as a page size.
 *
 * @param value - The raw param, such as `"50"`.
 * @param fallback - The list's default size, used for a missing or unknown value.
 * @returns A {@link PageSize}.
 *
 * @example
 * parsePageSize("100", 25); // 100
 * parsePageSize("30", 25); // 25
 */
export function parsePageSize(value: string, fallback: PageSize): PageSize {
  const size = Number(value);
  return PAGE_SIZES.includes(size as PageSize) ? (size as PageSize) : fallback;
}
