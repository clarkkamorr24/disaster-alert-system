import "server-only";

import { statusesThatCanBecome } from "@/lib/broadcast/delivery";
import { prisma } from "@/lib/db";
import { toCanonicalPhone } from "@/lib/domain/phone";
import { isUniqueViolation } from "@/lib/prisma-errors";
import type { BroadcastStore, DeliveryStore, RecipientUpdate } from "@/types/broadcast";

/**
 * Groups updates that change only the status and fail reason, so a whole
 * failed chunk is one `updateMany` instead of one query per recipient.
 * Updates that set a provider reference stay separate, since each is unique.
 */
function groupUpdates(updates: RecipientUpdate[]): { phones: string[]; update: RecipientUpdate }[] {
  const groups = new Map<string, { phones: string[]; update: RecipientUpdate }>();
  const single: { phones: string[]; update: RecipientUpdate }[] = [];

  for (const update of updates) {
    const phone = toCanonicalPhone(update.phone);
    if (update.providerRef !== undefined) {
      single.push({ phones: [phone], update });
      continue;
    }
    // JSON.stringify turns undefined into null, so "keep the reason" gets its own marker.
    const reasonKey = update.failReason === undefined ? "keep" : JSON.stringify(update.failReason);
    const key = `${update.status}|${reasonKey}`;
    const group = groups.get(key);
    if (group) group.phones.push(phone);
    else groups.set(key, { phones: [phone], update });
  }

  return [...groups.values(), ...single];
}

/**
 * Creates the {@link BroadcastStore} backed by the database.
 *
 * Recipients are matched on their canonical `+639…` phone, so numbers the
 * provider reports as `09…` still find their row. An update only applies to
 * recipients whose stored status may move to the new one, so two delivery
 * reports that race can't move a status backwards.
 *
 * @returns The Prisma-backed store, which is also a {@link DeliveryStore}.
 */
export function createPrismaBroadcastStore(): BroadcastStore & DeliveryStore {
  async function findIdByIdempotencyKey(key: string): Promise<string | null> {
    const broadcast = await prisma.broadcast.findUnique({
      where: { idempotencyKey: key },
      select: { id: true },
    });
    return broadcast?.id ?? null;
  }

  return {
    findIdByIdempotencyKey,

    async create(input) {
      try {
        // A nested createMany runs in the same transaction as the broadcast insert.
        const broadcast = await prisma.broadcast.create({
          data: {
            idempotencyKey: input.idempotencyKey,
            content: input.content,
            senderId: input.senderId,
            creditsPerRecipient: input.creditsPerRecipient,
            alertId: input.alertId,
            retryOfId: input.retryOfId,
            templateId: input.templateId,
            recipients: {
              createMany: {
                data: input.recipients.map((recipient) => ({
                  memberId: recipient.memberId,
                  phone: toCanonicalPhone(recipient.phone),
                  name: recipient.name,
                })),
              },
            },
          },
          select: { id: true },
        });
        return { id: broadcast.id, created: true };
      } catch (error) {
        // A concurrent submit with the same key won the insert.
        if (!isUniqueViolation(error, "idempotencyKey")) throw error;
        const existingId = await findIdByIdempotencyKey(input.idempotencyKey);
        if (!existingId) throw error;
        return { id: existingId, created: false };
      }
    },

    async addBlastId(broadcastId, blastId) {
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: { blastIds: { push: blastId } },
      });
    },

    async updateRecipients(broadcastId, updates) {
      if (updates.length === 0) return;
      await prisma.$transaction(
        groupUpdates(updates).map(({ phones, update }) =>
          prisma.broadcastRecipient.updateMany({
            where: { broadcastId, phone: { in: phones }, status: { in: statusesThatCanBecome(update.status) } },
            data: { status: update.status, failReason: update.failReason, providerRef: update.providerRef },
          }),
        ),
      );
    },

    async getRecipientStatus(broadcastId, phone) {
      const recipient = await prisma.broadcastRecipient.findUnique({
        where: { broadcastId_phone: { broadcastId, phone: toCanonicalPhone(phone) } },
        select: { status: true },
      });
      return recipient?.status ?? null;
    },
  };
}
