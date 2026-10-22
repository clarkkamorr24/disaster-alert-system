import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "SMS_DRIVER",
  "UNISMS_API_KEY",
  "UNISMS_SENDER_ID",
  "UNISMS_WEBHOOK_SECRET",
  "SMS_MESSAGE_PREFIX",
];

/** Imports a fresh copy of env.ts, so its cache starts empty. */
async function loadGetEnv() {
  vi.resetModules();
  const { getEnv } = await import("@/lib/env");
  return getEnv;
}

describe("getEnv", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) vi.stubEnv(key, undefined);
    vi.stubEnv("DATABASE_URL", "postgresql://example");
    vi.stubEnv("AUTH_SECRET", "secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("applies the defaults", async () => {
    const getEnv = await loadGetEnv();
    expect(getEnv()).toMatchObject({
      SMS_DRIVER: "fake",
      UNISMS_SENDER_ID: "Unisoft",
      SMS_MESSAGE_PREFIX: "Mi-isi FA:",
    });
  });

  it("treats blank values as unset", async () => {
    vi.stubEnv("SMS_DRIVER", "");
    vi.stubEnv("UNISMS_SENDER_ID", "  ");
    const getEnv = await loadGetEnv();
    expect(getEnv()).toMatchObject({ SMS_DRIVER: "fake", UNISMS_SENDER_ID: "Unisoft" });
  });

  it("throws naming UNISMS_API_KEY when SMS_DRIVER=unisms and the key is missing", async () => {
    vi.stubEnv("SMS_DRIVER", "unisms");
    vi.stubEnv("UNISMS_WEBHOOK_SECRET", "webhook-secret");
    const getEnv = await loadGetEnv();
    expect(() => getEnv()).toThrow("UNISMS_API_KEY");
  });

  it("accepts the unisms driver when both UniSMS secrets are set", async () => {
    vi.stubEnv("SMS_DRIVER", "unisms");
    vi.stubEnv("UNISMS_API_KEY", "api-key");
    vi.stubEnv("UNISMS_WEBHOOK_SECRET", "webhook-secret");
    const getEnv = await loadGetEnv();
    expect(getEnv().SMS_DRIVER).toBe("unisms");
  });

  it("names every missing variable in one error", async () => {
    vi.stubEnv("AUTH_SECRET", undefined);
    vi.stubEnv("SMS_DRIVER", "unisms");
    const getEnv = await loadGetEnv();
    expect(() => getEnv()).toThrow(
      "Missing or invalid environment variables: AUTH_SECRET, UNISMS_API_KEY, UNISMS_WEBHOOK_SECRET",
    );
  });

  it("rejects an unknown SMS_DRIVER", async () => {
    vi.stubEnv("SMS_DRIVER", "twilio");
    const getEnv = await loadGetEnv();
    expect(() => getEnv()).toThrow("SMS_DRIVER");
  });

  it("caches the first successful result", async () => {
    const getEnv = await loadGetEnv();
    const first = getEnv();
    vi.stubEnv("SMS_MESSAGE_PREFIX", "Changed:");
    expect(getEnv()).toBe(first);
  });
});
