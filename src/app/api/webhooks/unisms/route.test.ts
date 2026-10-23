import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const { env, applyProviderMessage, store } = vi.hoisted(() => ({
  env: { UNISMS_WEBHOOK_SECRET: "whsec_test" as string | undefined },
  applyProviderMessage: vi.fn(),
  store: { getRecipientStatus: vi.fn(), updateRecipients: vi.fn() },
}));
vi.mock("@/lib/env", () => ({ getEnv: () => env }));
vi.mock("@/lib/broadcast/delivery", () => ({ applyProviderMessage }));
vi.mock("@/lib/broadcast/prisma-store", () => ({ createPrismaBroadcastStore: () => store }));

const BODY = {
  event: "message.sent",
  id: "msg_1",
  message: {
    reference_id: "msg_1",
    recipient: "09171234567",
    status: "sent",
    fail_reason: null,
    content: "Mi-isi FA: Lahar warning",
    metadata: { broadcastId: "b1" },
  },
};

function post(body: string, secret?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret !== undefined) headers["webhook-secret-key"] = secret;
  return POST(new Request("http://localhost/api/webhooks/unisms", { method: "POST", headers, body }));
}

describe("POST /api/webhooks/unisms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.UNISMS_WEBHOOK_SECRET = "whsec_test";
    applyProviderMessage.mockResolvedValue("updated");
  });

  it.each([
    ["no header", undefined],
    ["a wrong header", "whsec_nope"],
    ["a header of a different length", "whsec_test_longer"],
  ])("rejects %s with 401", async (_case, secret) => {
    const res = await post(JSON.stringify(BODY), secret);
    expect(res.status).toBe(401);
    expect(applyProviderMessage).not.toHaveBeenCalled();
  });

  it("rejects every call while the secret is unset", async () => {
    env.UNISMS_WEBHOOK_SECRET = undefined;
    const res = await post(JSON.stringify(BODY), "");
    expect(res.status).toBe(401);
  });

  it("applies a valid message and answers 200", async () => {
    const res = await post(JSON.stringify(BODY), "whsec_test");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(applyProviderMessage).toHaveBeenCalledWith(
      {
        referenceId: "msg_1",
        recipient: "09171234567",
        status: "sent",
        failReason: null,
        metadata: { broadcastId: "b1" },
      },
      store,
    );
  });

  it("answers 200 for an unknown recipient, so UniSMS stops retrying", async () => {
    applyProviderMessage.mockResolvedValue("ignored");
    const res = await post(JSON.stringify(BODY), "whsec_test");
    expect(res.status).toBe(200);
  });

  it("answers 400 for malformed JSON", async () => {
    const res = await post("{not json", "whsec_test");
    expect(res.status).toBe(400);
    expect(applyProviderMessage).not.toHaveBeenCalled();
  });

  it.each([
    ["no message", { event: "message.sent", id: "msg_1" }],
    ["a message without a recipient", { ...BODY, message: { reference_id: "msg_1", status: "sent" } }],
    ["a JSON array", []],
  ])("answers 400 for %s", async (_case, body) => {
    const res = await post(JSON.stringify(body), "whsec_test");
    expect(res.status).toBe(400);
    expect(applyProviderMessage).not.toHaveBeenCalled();
  });
});
