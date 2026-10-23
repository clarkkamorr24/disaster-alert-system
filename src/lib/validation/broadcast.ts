import { z } from "zod";

import { NO_BROADCAST_ZONES_MESSAGE } from "@/lib/broadcast/compose";

/**
 * A send from the compose form: a UUID idempotency key, the message as typed,
 * an optional alert id, and at least one zone id (duplicates removed).
 */
export const broadcastInputSchema = z.object({
  idempotencyKey: z.uuid({ error: "Reload the page and try again." }),
  content: z.string(),
  alertId: z.string().min(1).nullable(),
  zoneIds: z
    .array(z.string().min(1))
    .min(1, NO_BROADCAST_ZONES_MESSAGE)
    .transform((ids) => [...new Set(ids)]),
});

/** A parsed send from the compose form. */
export type BroadcastInput = z.infer<typeof broadcastInputSchema>;

/** A resend from the compose form: a UUID idempotency key, the message as typed, and the original broadcast's id. */
export const resendInputSchema = z.object({
  idempotencyKey: broadcastInputSchema.shape.idempotencyKey,
  content: z.string(),
  retryOfId: z.string().min(1, "Reload the page and try again."),
});

/** A parsed resend from the compose form. */
export type ResendInput = z.infer<typeof resendInputSchema>;
