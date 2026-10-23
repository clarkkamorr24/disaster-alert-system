/**
 * Labels the search shortcut for the visitor's keyboard.
 *
 * @param platform - `navigator.platform`, such as `MacIntel` or `Win32`.
 * @returns `⌘ K` on Apple devices, `Ctrl K` everywhere else.
 */
export function shortcutLabel(platform: string): string {
  return /mac|iphone|ipad|ipod/i.test(platform) ? "⌘ K" : "Ctrl K";
}
