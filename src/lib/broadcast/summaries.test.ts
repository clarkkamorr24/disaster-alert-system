import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadBroadcastSummaries, loadBroadcastZoneNames } from "./summaries";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    broadcast: { findMany: vi.fn() },
    broadcastRecipient: { groupBy: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));
vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ SMS_MESSAGE_PREFIX: "Mi-isi FA:" }) }));

const CREATED = new Date("2026-10-23T00:00:00Z");

describe("loadBroadcastSummaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filters, pages, and adds counts, a title, and a status to each broadcast", async () => {
    prisma.broadcast.findMany.mockResolvedValue([
      { id: "b1", createdAt: CREATED, content: "Mi-isi FA: Lumikas", retryOfId: null, alert: { title: "Mayon", hazardType: "VOLCANIC_ERUPTION" } },
      { id: "b2", createdAt: CREATED, content: "Mi-isi FA: Pulong bukas", retryOfId: null, alert: null },
    ]);
    prisma.broadcastRecipient.groupBy.mockResolvedValue([
      { broadcastId: "b1", status: "SENT", _count: { _all: 3 } },
      { broadcastId: "b1", status: "FAILED", _count: { _all: 1 } },
      { broadcastId: "b1", status: "SKIPPED", _count: { _all: 1 } },
      { broadcastId: "b2", status: "PENDING", _count: { _all: 2 } },
    ]);

    const result = await loadBroadcastSummaries({ alertId: "a1" }, 25, 25);

    expect(prisma.broadcast.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { alertId: "a1" }, orderBy: { createdAt: "desc" }, skip: 25, take: 25 }),
    );
    expect(prisma.broadcastRecipient.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { broadcastId: { in: ["b1", "b2"] } } }),
    );
    expect(result.map(({ id, title, recipientCount, sent, notReached, status }) => ({ id, title, recipientCount, sent, notReached, status }))).toEqual([
      { id: "b1", title: "Mayon", recipientCount: 5, sent: 3, notReached: 2, status: "PARTIAL" },
      { id: "b2", title: "Pulong bukas", recipientCount: 2, sent: 0, notReached: 0, status: "SENDING" },
    ]);
    expect(result[1].counts).toEqual({ PENDING: 2, RETRYING: 0, SENT: 0, FAILED: 0, SKIPPED: 0 });
  });

  it("includes every broadcast with an empty filter", async () => {
    prisma.broadcast.findMany.mockResolvedValue([]);
    prisma.broadcastRecipient.groupBy.mockResolvedValue([]);
    expect(await loadBroadcastSummaries({}, 0, 5)).toEqual([]);
    expect(prisma.broadcast.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});

describe("loadBroadcastZoneNames", () => {
  beforeEach(() => vi.clearAllMocks());

  it("skips the query when there are no broadcasts", async () => {
    expect(await loadBroadcastZoneNames([])).toEqual(new Map());
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("groups zone names by broadcast", async () => {
    prisma.$queryRaw.mockResolvedValue([
      { broadcastId: "b1", name: "Purok 1" },
      { broadcastId: "b1", name: "Purok 2" },
      { broadcastId: "b2", name: "Purok 3" },
    ]);
    expect(await loadBroadcastZoneNames(["b1", "b2", "b3"])).toEqual(
      new Map([
        ["b1", ["Purok 1", "Purok 2"]],
        ["b2", ["Purok 3"]],
      ]),
    );
  });
});
