import { describe, expect, it } from "vitest";

import { isCriticalActive, severityTone } from "@/lib/domain/status-tone";

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

describe("isCriticalActive", () => {
  it("is true only for an active Critical alert", () => {
    expect(isCriticalActive("CRITICAL")).toBe(true);
    expect(isCriticalActive("CRITICAL", "ACTIVE")).toBe(true);
  });

  it("is false for a resolved Critical alert", () => {
    expect(isCriticalActive("CRITICAL", "RESOLVED")).toBe(false);
  });

  it("is false for other severities and clear zones", () => {
    expect(isCriticalActive("HIGH")).toBe(false);
    expect(isCriticalActive("MODERATE")).toBe(false);
    expect(isCriticalActive("LOW")).toBe(false);
    expect(isCriticalActive(null)).toBe(false);
  });
});
