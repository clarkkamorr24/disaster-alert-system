import { z } from "zod";

import { normalizePhilippineMobile } from "@/lib/domain/phone";

/** Shown when the mobile number can't be normalized. */
export const INVALID_PHONE_MESSAGE = "Enter a PH mobile number, e.g. 0917 123 4567.";

/** Shown when another member already has the mobile number. */
export const DUPLICATE_PHONE_MESSAGE = "This phone number is already registered to another member.";

/** A required, trimmed name of 1–60 characters. */
function personName(label: string) {
  return z
    .string()
    .trim()
    .min(1, `Enter the ${label}.`)
    .max(60, "Use 60 characters or fewer.");
}

/** An optional, trimmed text field; blank becomes `undefined`. */
function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .optional()
    .transform((value) => value || undefined);
}

/**
 * The member edit form: trimmed names (1–60 characters), a mobile number
 * normalized to `+639XXXXXXXXX`, a zone id, and optional crops (up to 100
 * characters) and notes (up to 500). Consent is not part of an edit.
 */
export const memberUpdateSchema = z.object({
  firstName: personName("first name"),
  lastName: personName("last name"),
  phone: z.string().transform((value, ctx) => {
    const result = normalizePhilippineMobile(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: INVALID_PHONE_MESSAGE });
      return z.NEVER;
    }
    return result.e164;
  }),
  zoneId: z.string().trim().min(1, "Choose a zone."),
  crops: optionalText(100),
  notes: optionalText(500),
});

/**
 * The new-member form: {@link memberUpdateSchema} plus `consent`, which must
 * be `true` (consent under RA 10173 is recorded when a member is added).
 */
export const memberInputSchema = memberUpdateSchema.extend({
  consent: z.literal(true, { error: "Confirm the member's consent before adding them." }),
});

/** A parsed, valid new-member form. */
export type MemberInput = z.infer<typeof memberInputSchema>;

/** A parsed, valid member edit form. */
export type MemberUpdate = z.infer<typeof memberUpdateSchema>;
