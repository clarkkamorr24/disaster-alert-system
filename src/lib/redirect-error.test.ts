import { describe, expect, it } from "vitest";

import { isRedirectError } from "./redirect-error";

describe("isRedirectError", () => {
  it("is true for an error carrying a NEXT_REDIRECT digest", () => {
    const error = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;push;/zones;307;" });
    expect(isRedirectError(error)).toBe(true);
  });

  it("is false for ordinary errors and non-objects", () => {
    expect(isRedirectError(new Error("NEXT_REDIRECT"))).toBe(false);
    expect(isRedirectError({ digest: "NEXT_NOT_FOUND" })).toBe(false);
    expect(isRedirectError(null)).toBe(false);
    expect(isRedirectError("NEXT_REDIRECT")).toBe(false);
  });
});
