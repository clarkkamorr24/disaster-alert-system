import { describe, expect, it } from "vitest";

import { memberListHref, memberListWhere, parseMemberListFilters } from "./list-filters";

const DEFAULTS = { q: "", zoneId: undefined, status: "active", page: 1 } as const;

describe("parseMemberListFilters", () => {
  it("falls back to active members on page 1", () => {
    expect(parseMemberListFilters({})).toEqual(DEFAULTS);
  });

  it("reads trimmed values and ignores invalid ones", () => {
    expect(
      parseMemberListFilters({ q: " juan ", zone: "z1", status: "all", page: "3" }),
    ).toEqual({ q: "juan", zoneId: "z1", status: "all", page: 3 });
    expect(parseMemberListFilters({ zone: "", status: "deleted", page: "-2" })).toEqual(DEFAULTS);
    expect(parseMemberListFilters({ page: "abc" }).page).toBe(1);
  });

  it("uses the first value of a repeated param", () => {
    expect(parseMemberListFilters({ status: ["inactive", "all"] }).status).toBe("inactive");
  });
});

describe("memberListWhere", () => {
  it("filters active members by default", () => {
    expect(memberListWhere(DEFAULTS)).toEqual({ isActive: true });
  });

  it("drops the active filter for all, and filters by zone", () => {
    expect(memberListWhere({ ...DEFAULTS, status: "all", zoneId: "z1" })).toEqual({ zoneId: "z1" });
    expect(memberListWhere({ ...DEFAULTS, status: "inactive" })).toEqual({ isActive: false });
  });

  it("matches every word against first or last name", () => {
    const where = memberListWhere({ ...DEFAULTS, q: "juan cruz" });
    expect(where.OR).toHaveLength(1);
    expect(JSON.stringify(where.OR)).toContain('"contains":"juan"');
    expect(JSON.stringify(where.OR)).toContain('"contains":"cruz"');
  });

  it("matches local-format digits against the stored +63 phone", () => {
    expect(memberListWhere({ ...DEFAULTS, q: "0917 123" }).OR).toContainEqual({
      phone: { contains: "917123" },
    });
    expect(memberListWhere({ ...DEFAULTS, q: "+63 917" }).OR).toContainEqual({
      phone: { contains: "917" },
    });
    expect(memberListWhere({ ...DEFAULTS, q: "63" }).OR).toContainEqual({
      phone: { contains: "63" },
    });
  });
});

describe("memberListHref", () => {
  it("leaves out defaults", () => {
    expect(memberListHref(DEFAULTS)).toBe("/members");
  });

  it("keeps the filters and sets the page", () => {
    expect(memberListHref({ q: "0917", zoneId: "z1", status: "all", page: 1 }, 2)).toBe(
      "/members?q=0917&zone=z1&status=all&page=2",
    );
  });
});
