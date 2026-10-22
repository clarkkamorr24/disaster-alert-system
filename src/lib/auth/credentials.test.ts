import { beforeAll, describe, expect, it, vi } from "vitest";

import type { DbOfficer } from "@/types/auth";
import { verifyCredentials, type CredentialsDeps } from "./credentials";
import { hashPassword } from "./password";

describe("verifyCredentials", () => {
  let officer: DbOfficer;
  let deps: CredentialsDeps;

  beforeAll(async () => {
    officer = {
      id: "o1",
      name: "Officer",
      email: "officer@x.ph",
      passwordHash: await hashPassword("s3cret-pass"),
      sessionVersion: 3,
    };
    deps = {
      findOfficerByEmail: vi.fn(async (email: string) => (email === officer.email ? officer : null)),
    };
  });

  it("returns the session fields for a mixed-case email and the right password", async () => {
    expect(await verifyCredentials("Officer@X.ph", "s3cret-pass", deps)).toEqual({
      id: "o1",
      name: "Officer",
      email: "officer@x.ph",
      sessionVersion: 3,
    });
  });

  it("trims and lowercases the email before the lookup", async () => {
    await verifyCredentials("  OFFICER@x.ph ", "s3cret-pass", deps);
    expect(deps.findOfficerByEmail).toHaveBeenLastCalledWith("officer@x.ph");
  });

  it("returns null for a wrong password", async () => {
    expect(await verifyCredentials("officer@x.ph", "wrong", deps)).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    expect(await verifyCredentials("nobody@x.ph", "s3cret-pass", deps)).toBeNull();
  });
});
