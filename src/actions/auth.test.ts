import { CredentialsSignin } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { signInAction } from "./auth";

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock("@/auth", () => ({ signIn }));

function form(email: string, password: string): FormData {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

describe("signInAction", () => {
  beforeEach(() => {
    signIn.mockReset();
  });

  it("signs in with the trimmed email and redirects to the dashboard", async () => {
    await signInAction(null, form(" officer@x.ph ", "s3cret-pass"));
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "officer@x.ph",
      password: "s3cret-pass",
      redirectTo: "/dashboard",
    });
  });

  it("returns field errors without calling signIn for a bad email or empty password", async () => {
    const result = await signInAction(null, form("not-an-email", ""));
    expect(signIn).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual(["email", "password"]);
  });

  it("maps an Auth.js error to the generic message", async () => {
    signIn.mockRejectedValue(new CredentialsSignin());
    expect(await signInAction(null, form("officer@x.ph", "wrong"))).toEqual({
      success: false,
      error: "Incorrect email or password.",
    });
  });

  it("re-throws anything else, such as the redirect", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    signIn.mockRejectedValue(redirect);
    await expect(signInAction(null, form("officer@x.ph", "s3cret-pass"))).rejects.toBe(redirect);
  });
});
