import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("verifies the original password and rejects others", async () => {
    const hash = await hashPassword("s3cret-pass");
    expect(await verifyPassword("s3cret-pass", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("uses cost 12 and a new salt each time", async () => {
    const first = await hashPassword("s3cret-pass");
    const second = await hashPassword("s3cret-pass");
    expect(first).toMatch(/^\$2[aby]\$12\$/);
    expect(first).not.toBe(second);
  });
});
