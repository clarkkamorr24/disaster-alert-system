import { describe, expect, it } from "vitest";

import { createFakeGateway, FAKE_SKIP_REASON } from "@/lib/sms/fake";

describe("createFakeGateway", () => {
  const gw = createFakeGateway();

  it("skips numbers ending in 0000 and reports the rest as sent", async () => {
    const result = await gw.blast({
      recipients: ["+639171234567", "+639171230000"],
      content: "hi",
      senderId: "Unisoft",
      metadata: { broadcastId: "b1" },
    });

    expect(result).toMatchObject({
      kind: "ok",
      queued: 1,
      skipped: [{ recipient: "+639171230000", reason: FAKE_SKIP_REASON }],
    });
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.blastId).toMatch(/^fake_/);

    const messages = await gw.getBlastMessages(result.blastId);
    expect(messages).toEqual([
      {
        referenceId: expect.stringMatching(/^msg_fake_/),
        recipient: "+639171234567",
        status: "sent",
        failReason: null,
        metadata: { broadcastId: "b1" },
      },
    ]);
  });

  it("uses the simulated skip reason", () => {
    expect(FAKE_SKIP_REASON).toBe("Simulated: network not reachable");
  });

  it("keeps blasts across gateway instances", async () => {
    const result = await gw.blast({ recipients: ["+639171234567"], content: "hi", senderId: "Unisoft", metadata: {} });
    if (result.kind !== "ok") throw new Error("expected ok");

    expect(await createFakeGateway().getBlastMessages(result.blastId)).toHaveLength(1);
  });

  it("returns no messages for an unknown blast", async () => {
    expect(await gw.getBlastMessages("nope")).toEqual([]);
  });

  it("reports a balance of 1,000,000 credits", async () => {
    expect(await gw.getCreditBalance()).toBe(1_000_000);
  });
});
