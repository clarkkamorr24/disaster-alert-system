import { z } from "zod";

import { HazardType, Severity } from "@/generated/prisma/enums";

/** Shown when an alert is submitted without any affected zone. */
export const NO_ZONES_MESSAGE = "Select at least one affected zone.";

/**
 * The new-alert form: a trimmed title (3–120 characters), a hazard type, a
 * severity, an optional official level (up to 60 characters; blank becomes
 * `undefined`), a description (up to 2,000 characters; may be blank), and at
 * least one affected zone id (duplicates removed).
 */
export const alertInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Enter at least 3 characters.")
    .max(120, "Use 120 characters or fewer."),
  hazardType: z.enum(HazardType, { error: "Choose a hazard type." }),
  severity: z.enum(Severity, { error: "Choose a severity." }),
  officialLevel: z
    .string()
    .trim()
    .max(60, "Use 60 characters or fewer.")
    .optional()
    .transform((value) => value || undefined),
  description: z.string().trim().max(2000, "Use 2,000 characters or fewer."),
  zoneIds: z
    .array(z.string().min(1))
    .min(1, NO_ZONES_MESSAGE)
    .transform((ids) => [...new Set(ids)]),
});

/** A parsed, valid alert form. */
export type AlertInput = z.infer<typeof alertInputSchema>;

/**
 * The New alert form: the alert fields, a UUID idempotency key (one per form),
 * whether to send the SMS, and the SMS as typed. `content` isn't checked
 * here; the send checks it only when `send` is true.
 */
export const alertSendSchema = alertInputSchema.extend({
  idempotencyKey: z.uuid({ error: "Reload the page and try again." }),
  send: z.boolean(),
  content: z.string(),
});

/** A parsed New alert form. */
export type AlertSendParsed = z.infer<typeof alertSendSchema>;
