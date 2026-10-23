import { describe, expect, it } from "vitest";

import { BROADCAST_STATUS_LABELS, deriveBroadcastStatus, emptyStatusCounts } from "@/lib/broadcast/status";

describe("deriveBroadcastStatus", () => {
  it("is SENDING while any message is pending or retrying", () => {
    expect(deriveBroadcastStatus({ PENDING: 1, RETRYING: 0, SENT: 5, FAILED: 0, SKIPPED: 0 })).toBe("SENDING");
    expect(deriveBroadcastStatus({ PENDING: 0, RETRYING: 1, SENT: 0, FAILED: 3, SKIPPED: 0 })).toBe("SENDING");
  });

  it("is COMPLETED when every recipient was sent to", () => {
    expect(deriveBroadcastStatus({ PENDING: 0, RETRYING: 0, SENT: 6, FAILED: 0, SKIPPED: 0 })).toBe("COMPLETED");
  });

  it("is PARTIAL when some were sent to", () => {
    expect(deriveBroadcastStatus({ PENDING: 0, RETRYING: 0, SENT: 4, FAILED: 1, SKIPPED: 1 })).toBe("PARTIAL");
    expect(deriveBroadcastStatus({ PENDING: 0, RETRYING: 0, SENT: 11, FAILED: 0, SKIPPED: 1 })).toBe("PARTIAL");
  });

  it("is FAILED when nobody was sent to", () => {
    expect(deriveBroadcastStatus({ PENDING: 0, RETRYING: 0, SENT: 0, FAILED: 2, SKIPPED: 1 })).toBe("FAILED");
    expect(deriveBroadcastStatus({ PENDING: 0, RETRYING: 0, SENT: 0, FAILED: 0, SKIPPED: 1 })).toBe("FAILED");
  });
});

describe("emptyStatusCounts", () => {
  it("starts every status at zero, as a fresh object each time", () => {
    const counts = emptyStatusCounts();
    expect(counts).toEqual({ PENDING: 0, RETRYING: 0, SENT: 0, FAILED: 0, SKIPPED: 0 });
    counts.SENT += 1;
    expect(emptyStatusCounts().SENT).toBe(0);
  });
});

it("labels every derived status", () => {
  expect(BROADCAST_STATUS_LABELS).toEqual({
    SENDING: "Sending",
    COMPLETED: "Completed",
    PARTIAL: "Partially delivered",
    FAILED: "Failed",
  });
});
