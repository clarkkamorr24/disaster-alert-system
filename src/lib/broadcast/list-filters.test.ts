import { describe, expect, it } from "vitest";

import { broadcastListHref, broadcastListWhere, parseBroadcastListFilters } from "./list-filters";

const DEFAULTS = { q: "", kind: "all", page: 1, size: 10 } as const;

describe("parseBroadcastListFilters", () => {
  it("reads the search, kind, and page", () => {
    expect(parseBroadcastListFilters({ q: " lahar ", kind: "resend", page: "3", size: "50" })).toEqual({
      q: "lahar",
      kind: "resend",
      page: 3,
      size: 50,
    });
  });

  it("falls back for missing, invalid, or repeated values", () => {
    expect(parseBroadcastListFilters({})).toEqual(DEFAULTS);
    expect(parseBroadcastListFilters({ kind: "everything", page: "0" })).toEqual(DEFAULTS);
    expect(parseBroadcastListFilters({ page: "abc", size: "abc" })).toEqual(DEFAULTS);
    expect(parseBroadcastListFilters({ kind: ["alert", "resend"] }).kind).toBe("alert");
  });
});

describe("broadcastListWhere", () => {
  it("has no conditions by default", () => {
    expect(broadcastListWhere(DEFAULTS)).toEqual({});
  });

  it("builds each kind", () => {
    expect(broadcastListWhere({ ...DEFAULTS, kind: "alert" })).toEqual({ alertId: { not: null }, retryOfId: null });
    expect(broadcastListWhere({ ...DEFAULTS, kind: "announcement" })).toEqual({ alertId: null, retryOfId: null });
    expect(broadcastListWhere({ ...DEFAULTS, kind: "resend" })).toEqual({ retryOfId: { not: null } });
  });

  it("matches the search on the message or the alert title", () => {
    expect(broadcastListWhere({ ...DEFAULTS, q: "Mayon", kind: "resend" })).toEqual({
      retryOfId: { not: null },
      OR: [
        { content: { contains: "Mayon", mode: "insensitive" } },
        { alert: { title: { contains: "Mayon", mode: "insensitive" } } },
      ],
    });
  });
});

describe("broadcastListHref", () => {
  it("drops defaults", () => {
    expect(broadcastListHref(DEFAULTS)).toBe("/broadcasts");
  });

  it("keeps the search, kind, and page", () => {
    expect(broadcastListHref({ q: "lahar flow", kind: "alert", page: 1, size: 10 }, 2)).toBe(
      "/broadcasts?q=lahar+flow&kind=alert&page=2",
    );
    expect(broadcastListHref({ ...DEFAULTS, kind: "resend", size: 100 })).toBe("/broadcasts?kind=resend&size=100");
  });
});
