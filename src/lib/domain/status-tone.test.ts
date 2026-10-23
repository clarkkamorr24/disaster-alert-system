import { describe, expect, it } from "vitest";

import { severityTone } from "@/lib/domain/status-tone";

describe("severityTone", () => {
  it("maps every severity to its tone", () => {
    expect(severityTone("CRITICAL")).toBe("critical");
    expect(severityTone("HIGH")).toBe("high");
    expect(severityTone("MODERATE")).toBe("moderate");
    expect(severityTone("LOW")).toBe("low");
  });

  it("is clear when nothing is active", () => {
    expect(severityTone(null)).toBe("clear");
  });
});
