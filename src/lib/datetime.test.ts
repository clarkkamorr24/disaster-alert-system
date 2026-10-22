import { describe, expect, it } from "vitest";

import { formatManilaDate } from "./datetime";

describe("formatManilaDate", () => {
  it("shows the calendar day in Philippine time", () => {
    // 16:30 UTC is 00:30 the next day in Manila (UTC+8).
    expect(formatManilaDate(new Date("2026-10-21T16:30:00Z"))).toBe("October 22, 2026");
  });
});
