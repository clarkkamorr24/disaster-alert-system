import { describe, expect, it } from "vitest";

import { shortcutLabel } from "./shortcut";

describe("shortcutLabel", () => {
  it("uses ⌘ on Apple devices", () => {
    expect(shortcutLabel("MacIntel")).toBe("⌘ K");
    expect(shortcutLabel("iPhone")).toBe("⌘ K");
  });

  it("uses Ctrl elsewhere", () => {
    expect(shortcutLabel("Win32")).toBe("Ctrl K");
    expect(shortcutLabel("Linux x86_64")).toBe("Ctrl K");
    expect(shortcutLabel("")).toBe("Ctrl K");
  });
});
