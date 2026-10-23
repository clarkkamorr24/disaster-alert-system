import { describe, expect, it } from "vitest";

import {
  findUnfilledPlaceholders,
  pickDefaultTemplate,
  renderComposeMessage,
  unfilledPlaceholderMessage,
} from "@/lib/broadcast/compose";

const TEMPLATES = [
  { name: "All clear", hazardType: null },
  { name: "General hazard alert", hazardType: null },
  { name: "Lahar warning", hazardType: "LAHAR" as const },
];

describe("pickDefaultTemplate", () => {
  it("picks the template for an active alert's hazard", () => {
    expect(pickDefaultTemplate(TEMPLATES, { hazardType: "LAHAR", status: "ACTIVE" })?.name).toBe(
      "Lahar warning",
    );
  });

  it("falls back to General hazard alert when no template matches", () => {
    expect(pickDefaultTemplate(TEMPLATES, { hazardType: "TYPHOON", status: "ACTIVE" })?.name).toBe(
      "General hazard alert",
    );
  });

  it("picks All clear for a resolved alert", () => {
    expect(pickDefaultTemplate(TEMPLATES, { hazardType: "LAHAR", status: "RESOLVED" })?.name).toBe(
      "All clear",
    );
  });

  it("picks nothing without an alert or when the fallback was deleted", () => {
    expect(pickDefaultTemplate(TEMPLATES, null)).toBeNull();
    expect(pickDefaultTemplate([], { hazardType: "LAHAR", status: "RESOLVED" })).toBeNull();
  });
});

describe("renderComposeMessage", () => {
  const date = new Date("2026-10-22T06:30:00Z");
  const body = "{hazard} - {level}. Lugar: {zones}. ({date})";

  it("fills every placeholder from the alert", () => {
    expect(
      renderComposeMessage(body, { hazard: "Lahar", level: "", zoneNames: ["Purok 1", "Purok 2"] }, date),
    ).toBe("Lahar. Lugar: Purok 1, Purok 2. (Oct 22, 2:30 PM)");
  });

  it("fills only the date without an alert", () => {
    expect(renderComposeMessage(body, null, date)).toBe("{hazard} - {level}. Lugar: {zones}. (Oct 22, 2:30 PM)");
  });
});

describe("findUnfilledPlaceholders", () => {
  it("lists the placeholders left in a message", () => {
    expect(findUnfilledPlaceholders("{zones} and {hazard} {other}")).toEqual(["{hazard}", "{zones}"]);
    expect(findUnfilledPlaceholders("Lahar warning")).toEqual([]);
  });

  it("builds the error message", () => {
    expect(unfilledPlaceholderMessage(["{hazard}", "{zones}"])).toBe(
      "Replace {hazard}, {zones} with the actual text.",
    );
  });
});
