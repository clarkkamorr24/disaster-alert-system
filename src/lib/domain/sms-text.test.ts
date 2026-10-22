import { describe, expect, it } from "vitest";

import {
  containsLink,
  estimateCredits,
  findUnsupportedChars,
  sanitizeSmsText,
  validateSmsContent,
  withPrefix,
} from "@/lib/domain/sms-text";

describe("sanitizeSmsText", () => {
  it("replaces smart quotes, dashes, and ellipses", () => {
    expect(sanitizeSmsText("“Evacuate” now – Purok 3…")).toBe(
      '"Evacuate" now - Purok 3...',
    );
  });
});

describe("findUnsupportedChars", () => {
  it("returns emoji", () => {
    expect(findUnsupportedChars("Ingat po 🙏")).toEqual(["🙏"]);
  });
});

describe("containsLink", () => {
  it("detects a bare domain with a path", () => {
    expect(containsLink("see bit.ly/abc")).toBe(true);
  });

  it("ignores sentences with periods", () => {
    expect(containsLink("Alert Level 3. Lumikas na.")).toBe(false);
  });
});

describe("estimateCredits", () => {
  it("charges 1 credit up to 160 characters", () => {
    expect(estimateCredits("a".repeat(160))).toBe(1);
  });

  it("charges 2 credits from 161 characters", () => {
    expect(estimateCredits("a".repeat(161))).toBe(2);
  });
});

describe("withPrefix", () => {
  it("adds the prefix", () => {
    expect(withPrefix("Lahar warning", "Mi-isi FA:")).toBe(
      "Mi-isi FA: Lahar warning",
    );
  });

  it("does not add the prefix twice", () => {
    expect(withPrefix("Mi-isi FA: Lahar", "Mi-isi FA:")).toBe(
      "Mi-isi FA: Lahar",
    );
  });
});

describe("validateSmsContent", () => {
  it("rejects messages over 670 characters", () => {
    expect(validateSmsContent("x".repeat(671), { blockLinks: false }).ok).toBe(
      false,
    );
  });

  it("rejects links when blockLinks is on", () => {
    expect(validateSmsContent("go to www.x.ph", { blockLinks: true }).ok).toBe(
      false,
    );
  });

  it("rejects a blank message", () => {
    expect(validateSmsContent("   ", { blockLinks: false }).ok).toBe(false);
  });
});
