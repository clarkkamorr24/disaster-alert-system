import { describe, expect, it } from "vitest";

import type { AlertListFilters } from "@/types/alert";

import { alertListHref, alertListWhere, parseAlertListFilters } from "./list-filters";

const DEFAULTS: AlertListFilters = { tab: "active", q: "", hazard: null, severity: null, page: 1 };

describe("parseAlertListFilters", () => {
  it("falls back to active alerts on page 1 without filters", () => {
    expect(parseAlertListFilters({})).toEqual(DEFAULTS);
  });

  it("reads trimmed values", () => {
    expect(
      parseAlertListFilters({ tab: "all", q: " mayon ", hazard: "ASHFALL", severity: "CRITICAL", page: "2" }),
    ).toEqual({ tab: "all", q: "mayon", hazard: "ASHFALL", severity: "CRITICAL", page: 2 });
  });

  it("ignores an invalid tab, hazard, severity, or page", () => {
    expect(
      parseAlertListFilters({ tab: "deleted", hazard: "METEOR", severity: "extreme", page: "-1" }),
    ).toEqual(DEFAULTS);
    expect(parseAlertListFilters({ severity: "critical" }).severity).toBeNull();
  });
});

describe("alertListWhere", () => {
  it("filters by the tab's status", () => {
    expect(alertListWhere(DEFAULTS)).toEqual({ status: "ACTIVE" });
    expect(alertListWhere({ ...DEFAULTS, tab: "resolved" })).toEqual({ status: "RESOLVED" });
    expect(alertListWhere({ ...DEFAULTS, tab: "all" })).toEqual({});
  });

  it("leaves the tab out when asked, keeping the filters", () => {
    expect(alertListWhere({ ...DEFAULTS, hazard: "FLOOD", severity: "LOW" }, false)).toEqual({
      hazardType: "FLOOD",
      severity: "LOW",
    });
  });

  it("matches a hazard through its label", () => {
    expect(alertListWhere({ ...DEFAULTS, tab: "all", q: "ash" })).toEqual({
      OR: [
        { title: { contains: "ash", mode: "insensitive" } },
        { officialLevel: { contains: "ash", mode: "insensitive" } },
        { hazardType: { in: ["ASHFALL"] } },
      ],
    });
  });

  it("searches only the title and level when no hazard label matches", () => {
    expect(alertListWhere({ ...DEFAULTS, tab: "all", q: "mayon" }).OR).toHaveLength(2);
  });
});

describe("alertListHref", () => {
  it("drops defaults", () => {
    expect(alertListHref(DEFAULTS)).toBe("/alerts");
  });

  it("keeps the tab, search, and filters across pages", () => {
    const filters: AlertListFilters = { tab: "all", q: "ash fall", hazard: "ASHFALL", severity: "HIGH", page: 3 };
    expect(alertListHref(filters)).toBe("/alerts?tab=all&q=ash+fall&hazard=ASHFALL&severity=HIGH&page=3");
    expect(alertListHref(filters, 1)).toBe("/alerts?tab=all&q=ash+fall&hazard=ASHFALL&severity=HIGH");
  });
});
