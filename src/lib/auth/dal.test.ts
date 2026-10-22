import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: {} }));

import { isSessionCurrent } from "./dal";

describe("isSessionCurrent", () => {
  it("accepts a token with the current version", () => {
    expect(isSessionCurrent(3, 3)).toBe(true);
  });

  it("rejects a token from before a password change", () => {
    expect(isSessionCurrent(2, 3)).toBe(false);
  });

  it("rejects a token without a version", () => {
    expect(isSessionCurrent(undefined, 1)).toBe(false);
  });
});
