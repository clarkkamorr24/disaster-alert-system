import { describe, expect, it } from "vitest";

import {
  formatPhoneForDisplay,
  normalizePhilippineMobile,
  toCanonicalPhone,
} from "@/lib/domain/phone";

describe("normalizePhilippineMobile", () => {
  it("converts 09XXXXXXXXX to +639XXXXXXXXX", () => {
    expect(normalizePhilippineMobile("09171234567")).toEqual({
      ok: true,
      e164: "+639171234567",
    });
  });

  it.each([
    "+639171234567",
    "639171234567",
    "0917 123 4567",
    "0917-123-4567",
    "9171234567",
  ])("accepts %s", (input) => {
    expect(normalizePhilippineMobile(input)).toEqual({
      ok: true,
      e164: "+639171234567",
    });
  });

  it.each(["(052) 820-1234", "0917123456", "9.17E+09", "+6328123456", ""])(
    "rejects %j",
    (input) => {
      const result = normalizePhilippineMobile(input);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).not.toBe("");
    },
  );
});

describe("formatPhoneForDisplay", () => {
  it("formats a canonical number in local format", () => {
    expect(formatPhoneForDisplay("+639171234567")).toBe("0917 123 4567");
  });
});

describe("toCanonicalPhone", () => {
  it("normalizes a Philippine mobile number", () => {
    expect(toCanonicalPhone("0917 123 4567")).toBe("+639171234567");
  });

  it("returns anything else unchanged", () => {
    expect(toCanonicalPhone("12345")).toBe("12345");
  });
});
