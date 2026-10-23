import { describe, expect, it } from "vitest";

import { formatManilaDate, formatManilaDateTime } from "./datetime";

describe("formatManilaDate", () => {
  it("shows the calendar day in Philippine time", () => {
    // 16:30 UTC is 00:30 the next day in Manila (UTC+8).
    expect(formatManilaDate(new Date("2026-10-21T16:30:00Z"))).toBe("October 22, 2026");
  });
});

describe("formatManilaDateTime", () => {
  it("shows the date and time of day in Philippine time", () => {
    // ICU may put a narrow no-break space before AM/PM.
    expect(formatManilaDateTime(new Date("2026-10-21T16:30:00Z")).replace(/\s/g, " ")).toBe(
      "Oct 22, 2026, 12:30 AM",
    );
  });
});
