import { describe, expect, it } from "vitest";

import { formatManilaDate, formatManilaDateTime, formatManilaTime } from "./datetime";

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

describe("formatManilaTime", () => {
  it("shows the time of day in Philippine time", () => {
    expect(formatManilaTime(new Date("2026-10-23T00:45:00Z")).replace(/\s/g, " ")).toBe("8:45 AM");
    expect(formatManilaTime(new Date("2026-10-23T06:05:00Z")).replace(/\s/g, " ")).toBe("2:05 PM");
  });
});
