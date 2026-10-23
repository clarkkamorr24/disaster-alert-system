import { describe, expect, it } from "vitest";

import {
  formatManilaDate,
  formatManilaDateTime,
  formatManilaTime,
  formatRelativeManila,
  startOfManilaYear,
} from "./datetime";

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

describe("startOfManilaYear", () => {
  it("gives Manila midnight on 1 January", () => {
    // 15:00 UTC on 1 January is already 11 PM on 1 January in Manila.
    expect(startOfManilaYear(new Date("2026-01-01T15:00:00Z")).toISOString()).toBe("2025-12-31T16:00:00.000Z");
  });

  it("uses the Manila year when UTC is still in the previous one", () => {
    // 20:00 UTC on 31 December is 4 AM on 1 January in Manila.
    expect(startOfManilaYear(new Date("2026-12-31T20:00:00Z")).toISOString()).toBe("2026-12-31T16:00:00.000Z");
  });
});

describe("formatRelativeManila", () => {
  // 10 AM on 23 October 2026 in Manila.
  const now = new Date("2026-10-23T02:00:00Z");
  const format = (iso: string) => formatRelativeManila(new Date(iso), now).replace(/\s/g, " ");

  it("says Today and Yesterday by the Manila calendar day", () => {
    expect(format("2026-10-23T00:24:00Z")).toBe("Today, 8:24 AM");
    // 16:30 UTC on 22 October is 00:30 on 23 October in Manila.
    expect(format("2026-10-22T16:30:00Z")).toBe("Today, 12:30 AM");
    expect(format("2026-10-22T08:16:00Z")).toBe("Yesterday, 4:16 PM");
  });

  it("shows the date, and the year when it isn't the current one", () => {
    expect(format("2026-05-18T06:10:00Z")).toBe("May 18, 2:10 PM");
    expect(format("2025-12-30T01:00:00Z")).toBe("Dec 30, 2025, 9:00 AM");
  });
});
