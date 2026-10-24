import { describe, expect, it } from "vitest";

import { broadcastInputSchema, resendInputSchema } from "./broadcast";

const KEY = "4f9c2a7e-1b3d-4c5e-8f60-123456789abc";
const SEND = { idempotencyKey: KEY, content: "Lahar warning", alertId: null, zoneIds: ["z1"] };
const RESEND = { idempotencyKey: KEY, content: "Lahar warning", retryOfId: "b1" };

describe("broadcast schemas templateId", () => {
  it("defaults to null when omitted", () => {
    expect(broadcastInputSchema.parse(SEND).templateId).toBeNull();
    expect(resendInputSchema.parse(RESEND).templateId).toBeNull();
  });

  it("keeps a given id or null", () => {
    expect(broadcastInputSchema.parse({ ...SEND, templateId: "t1" }).templateId).toBe("t1");
    expect(resendInputSchema.parse({ ...RESEND, templateId: null }).templateId).toBeNull();
  });

  it("rejects an empty id", () => {
    expect(broadcastInputSchema.safeParse({ ...SEND, templateId: "" }).success).toBe(false);
  });
});
