import "server-only";

import { prisma } from "@/lib/db";

/** How far up and down a resend chain is followed, so a bad link can't loop forever. */
const MAX_CHAIN_STEPS = 20;

/**
 * Finds a broadcast's resend chain: its original (the root) and every resend
 * in the root's tree created at or before it. A later resend isn't part of
 * the chain, so an older report keeps its counts.
 *
 * @param startId - The broadcast whose report is shown.
 * @param parentOf - Each known broadcast's `retryOfId`.
 * @param childrenOf - Each known broadcast's resends.
 * @param createdAt - Each known broadcast's creation time.
 * @returns The chain's broadcast ids, root first.
 */
export function collectChain(
  startId: string,
  parentOf: Map<string, string | null>,
  childrenOf: Map<string, string[]>,
  createdAt: Map<string, Date>,
): string[] {
  let rootId = startId;
  const seen = new Set([startId]);
  for (let parent = parentOf.get(rootId); parent && !seen.has(parent); parent = parentOf.get(rootId)) {
    seen.add(parent);
    rootId = parent;
  }

  const startTime = createdAt.get(startId)?.getTime() ?? Number.POSITIVE_INFINITY;
  const chain: string[] = [];
  const visited = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (visited.has(id)) continue;
    visited.add(id);
    const time = createdAt.get(id)?.getTime();
    if (id === startId || (time !== undefined && time <= startTime)) chain.push(id);
    queue.push(...(childrenOf.get(id) ?? []));
  }
  return chain;
}

/**
 * Counts, for each phone, how many broadcasts of a chain included it.
 *
 * @param phonesByBroadcast - The recipients' phones of each broadcast.
 * @param chainIds - From {@link collectChain}.
 * @returns Attempts by phone.
 */
export function countAttempts(phonesByBroadcast: Map<string, string[]>, chainIds: string[]): Map<string, number> {
  const attempts = new Map<string, number>();
  for (const id of new Set(chainIds)) {
    for (const phone of new Set(phonesByBroadcast.get(id) ?? [])) {
      attempts.set(phone, (attempts.get(phone) ?? 0) + 1);
    }
  }
  return attempts;
}

/**
 * Loads how many times each recipient of a broadcast was messaged across its
 * resend chain: the original and every resend up to and including this one.
 *
 * @param broadcastId - The broadcast whose report is shown.
 * @returns Attempts by canonical phone; 1 for every recipient of a broadcast without resends.
 */
export async function loadAttempts(broadcastId: string): Promise<Map<string, number>> {
  const parentOf = new Map<string, string | null>();
  const childrenOf = new Map<string, string[]>();
  const createdAt = new Map<string, Date>();

  let rootId = broadcastId;
  let currentId: string | null = broadcastId;
  for (let step = 0; currentId && step <= MAX_CHAIN_STEPS; step++) {
    const row: { retryOfId: string | null; createdAt: Date } | null = await prisma.broadcast.findUnique({
      where: { id: currentId },
      select: { retryOfId: true, createdAt: true },
    });
    if (!row) break;
    parentOf.set(currentId, row.retryOfId);
    createdAt.set(currentId, row.createdAt);
    rootId = currentId;
    currentId = row.retryOfId;
  }

  let level = [rootId];
  for (let depth = 0; level.length > 0 && depth < MAX_CHAIN_STEPS; depth++) {
    const children = await prisma.broadcast.findMany({
      where: { retryOfId: { in: level } },
      select: { id: true, retryOfId: true, createdAt: true },
    });
    for (const child of children) {
      parentOf.set(child.id, child.retryOfId);
      createdAt.set(child.id, child.createdAt);
      if (child.retryOfId) childrenOf.set(child.retryOfId, [...(childrenOf.get(child.retryOfId) ?? []), child.id]);
    }
    level = children.map((child) => child.id);
  }

  const chainIds = collectChain(broadcastId, parentOf, childrenOf, createdAt);
  const recipients = await prisma.broadcastRecipient.findMany({
    where: { broadcastId: { in: chainIds } },
    select: { broadcastId: true, phone: true },
  });
  const phonesByBroadcast = new Map<string, string[]>();
  for (const { broadcastId: id, phone } of recipients) {
    phonesByBroadcast.set(id, [...(phonesByBroadcast.get(id) ?? []), phone]);
  }
  return countAttempts(phonesByBroadcast, chainIds);
}
