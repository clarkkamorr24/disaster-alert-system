import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Imports a fresh copy of the SMS module, so getEnv's cache starts empty. */
async function loadSms() {
  vi.resetModules();
  return import("@/lib/sms");
}

describe("getSmsGateway / isTestMode", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "postgresql://example");
    vi.stubEnv("AUTH_SECRET", "secret");
    vi.stubEnv("SMS_DRIVER", undefined);
    vi.stubEnv("UNISMS_API_KEY", undefined);
    vi.stubEnv("UNISMS_WEBHOOK_SECRET", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses the fake driver by default", async () => {
    const { getSmsGateway, isTestMode } = await loadSms();

    expect(isTestMode()).toBe(true);
    expect(await getSmsGateway().getCreditBalance()).toBe(1_000_000);
  });

  it("uses UniSMS with the API key when SMS_DRIVER is unisms", async () => {
    vi.stubEnv("SMS_DRIVER", "unisms");
    vi.stubEnv("UNISMS_API_KEY", "sk_live");
    vi.stubEnv("UNISMS_WEBHOOK_SECRET", "whsec");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ sms_credits: 42 }));
    vi.stubGlobal("fetch", fetchMock);
    const { getSmsGateway, isTestMode } = await loadSms();

    expect(isTestMode()).toBe(false);
    expect(await getSmsGateway().getCreditBalance()).toBe(42);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://unismsapi.com/api/account",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Basic " + btoa("sk_live:") }) }),
    );
  });
});
