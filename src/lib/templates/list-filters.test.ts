import { describe, expect, it } from "vitest";

import type { TemplateListFilters } from "@/types/template";

import { filterTemplates, parseTemplateListFilters, templateListHref } from "./list-filters";

const DEFAULTS: TemplateListFilters = { q: "", hazard: null, usage: null, view: "card" };

const TEMPLATES = [
  { name: "All clear", body: "Wala nang banta.", hazardType: null, usageCount: 2 },
  { name: "Ashfall warning", body: "Magsuot ng mask.", hazardType: "ASHFALL" as const, usageCount: 0 },
  { name: "General hazard alert", body: "Mag-ingat sa ashfall.", hazardType: null, usageCount: 0 },
];

function names(filters: Partial<TemplateListFilters>): string[] {
  return filterTemplates(TEMPLATES, { ...DEFAULTS, ...filters }).map((t) => t.name);
}

describe("parseTemplateListFilters", () => {
  it("falls back to every template in the card view", () => {
    expect(parseTemplateListFilters({})).toEqual(DEFAULTS);
  });

  it("reads trimmed values", () => {
    expect(parseTemplateListFilters({ q: " ash ", hazard: "ANY", usage: "used", view: "list" })).toEqual({
      q: "ash",
      hazard: "ANY",
      usage: "used",
      view: "list",
    });
  });

  it("ignores unknown values", () => {
    expect(parseTemplateListFilters({ hazard: "ashfall", usage: "never", view: "grid" })).toEqual(DEFAULTS);
  });
});

describe("filterTemplates", () => {
  it("keeps every template without filters", () => {
    expect(filterTemplates(TEMPLATES, DEFAULTS)).toEqual(TEMPLATES);
  });

  it("matches the name or the message in any case", () => {
    expect(names({ q: "ASHFALL" })).toEqual(["Ashfall warning", "General hazard alert"]);
    expect(names({ q: "banta" })).toEqual(["All clear"]);
  });

  it("matches a hazard type, with ANY for templates without one", () => {
    expect(names({ hazard: "ASHFALL" })).toEqual(["Ashfall warning"]);
    expect(names({ hazard: "ANY" })).toEqual(["All clear", "General hazard alert"]);
  });

  it("matches used and unused templates", () => {
    expect(names({ usage: "used" })).toEqual(["All clear"]);
    expect(names({ usage: "unused" })).toEqual(["Ashfall warning", "General hazard alert"]);
  });

  it("combines the search and both filters", () => {
    expect(names({ q: "ashfall", hazard: "ANY", usage: "unused" })).toEqual(["General hazard alert"]);
    expect(names({ q: "ashfall", usage: "used" })).toEqual([]);
  });
});

describe("templateListHref", () => {
  it("leaves out defaults", () => {
    expect(templateListHref(DEFAULTS)).toBe("/templates");
  });

  it("keeps the search, filters, and view", () => {
    expect(templateListHref({ q: "all clear", hazard: "ANY", usage: "unused", view: "list" })).toBe(
      "/templates?q=all+clear&hazard=ANY&usage=unused&view=list",
    );
  });
});
