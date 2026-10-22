import { describe, expect, it } from "vitest";

import { accountProfileSchema, changePasswordSchema } from "./account";

describe("changePasswordSchema", () => {
  it("rejects a confirmation that doesn't match", () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: "a", newPassword: "longenough1", confirmPassword: "different11" })
        .success,
    ).toBe(false);
  });

  it("rejects a new password shorter than 10 characters", () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: "a", newPassword: "short", confirmPassword: "short" }).success,
    ).toBe(false);
  });

  it("rejects reusing the current password", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "samepass123",
        newPassword: "samepass123",
        confirmPassword: "samepass123",
      }).success,
    ).toBe(false);
  });

  it("rejects a new password over 72 bytes", () => {
    const long = "é".repeat(37); // 74 bytes in UTF-8
    expect(
      changePasswordSchema.safeParse({ currentPassword: "old-pass-1", newPassword: long, confirmPassword: long }).success,
    ).toBe(false);
  });

  it("accepts a valid change", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "old-pass-1",
        newPassword: "new-pass-12",
        confirmPassword: "new-pass-12",
      }).success,
    ).toBe(true);
  });
});

describe("accountProfileSchema", () => {
  it("trims the name and lowercases the email", () => {
    expect(accountProfileSchema.parse({ name: " Ana ", email: "Ana@X.PH" })).toEqual({
      name: "Ana",
      email: "ana@x.ph",
    });
  });
});
