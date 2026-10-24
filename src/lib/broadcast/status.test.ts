import { describe, expect, it } from "vitest";

import {
  BROADCAST_STATUS_LABELS,
  deliveryBreakdown,
  deliveryRate,
  deriveBroadcastStatus,
  emptyStatusCounts,
  formatRate,
} from "@/lib/broadcast/status";

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

describe("deliveryRate", () => {
  it("is null without recipients", () => {
    expect(deliveryRate(emptyStatusCounts())).toBeNull();
  });

  it("is SENT over every recipient", () => {
    const rate = deliveryRate({ PENDING: 0, RETRYING: 0, SENT: 27, FAILED: 0, SKIPPED: 1 });
    expect(rate).toBeCloseTo(0.9643, 4);
    expect(formatRate(rate)).toBe("96.4%");
  });

  it("is 0% when every number was skipped", () => {
    const rate = deliveryRate({ PENDING: 0, RETRYING: 0, SENT: 0, FAILED: 0, SKIPPED: 3 });
    expect(rate).toBe(0);
    expect(formatRate(rate)).toBe("0%");
  });
});

describe("formatRate", () => {
  it("shows a dash for no rate and drops a trailing .0", () => {
    expect(formatRate(null)).toBe("—");
    expect(formatRate(1)).toBe("100%");
  });
});

describe("deliveryBreakdown", () => {
  it("groups pending with retrying and failed with skipped", () => {
    expect(deliveryBreakdown({ PENDING: 2, RETRYING: 1, SENT: 5, FAILED: 1, SKIPPED: 3 })).toEqual({
      sent: 5,
      pending: 3,
      notReached: 4,
    });
  });
});
