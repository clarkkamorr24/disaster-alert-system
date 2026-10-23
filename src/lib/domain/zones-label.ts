/**
 * Names the zones a broadcast or alert covers, for lists and cards.
 *
 * @param names - Zone names, in any order, without duplicates.
 * @param totalZones - How many zones exist in all.
 * @returns `All zones` when the names cover every zone, `—` when there are
 *   none, otherwise the names sorted and joined with `, `.
 *
 * @example
 * zonesLabel(["Purok 2", "Purok 1"], 4); // "Purok 1, Purok 2"
 */
export function zonesLabel(names: string[], totalZones: number): string {
  if (names.length === 0) return "—";
  if (names.length >= totalZones) return "All zones";
  return [...names].sort((a, b) => a.localeCompare(b, "en", { numeric: true })).join(", ");
}
