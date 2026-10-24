import { TEMPLATE_NAME_MAX_LENGTH } from "@/lib/validation/template";

/** A trailing ` (copy)` or ` (copy N)`, so a copy of a copy doesn't nest. */
const COPY_SUFFIX = / \(copy(?: \d+)?\)$/;

/**
 * Names a duplicate of a template: `X (copy)`, or `X (copy 2)`, `X (copy 3)`…
 * when that is taken. Copying `X (copy)` numbers from the same `X` instead of
 * nesting, and `X` is cut so the result fits {@link TEMPLATE_NAME_MAX_LENGTH}.
 *
 * @param name - The name of the template being duplicated.
 * @param existingNames - Every template name in use, compared exactly (names are unique case-sensitively).
 * @returns The first free copy name.
 */
export function copyName(name: string, existingNames: readonly string[]): string {
  const base = name.replace(COPY_SUFFIX, "");
  const taken = new Set(existingNames);
  for (let n = 1; ; n++) {
    const suffix = n === 1 ? " (copy)" : ` (copy ${n})`;
    const candidate = base.slice(0, TEMPLATE_NAME_MAX_LENGTH - suffix.length).trimEnd() + suffix;
    if (!taken.has(candidate)) return candidate;
  }
}
