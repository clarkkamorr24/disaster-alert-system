import { z } from "zod";

import { HazardType } from "@/generated/prisma/enums";
import { SMS_MAX_CHARS, withPrefix } from "@/lib/domain/sms-text";
import { findUnknownPlaceholders, TEMPLATE_PLACEHOLDERS } from "@/lib/templates/render";

const PLACEHOLDER_LIST = `${TEMPLATE_PLACEHOLDERS.slice(0, -1)
  .map((name) => `{${name}}`)
  .join(", ")} or {${TEMPLATE_PLACEHOLDERS.at(-1)}}`;

/**
 * The message shown for unknown placeholders.
 *
 * @param names - Unknown placeholder names, without braces; at least one.
 * @returns For example `Unknown placeholder: {hazrd}. Use {hazard}, {level}, {zones} or {date}.`
 */
export function unknownPlaceholderMessage(names: string[]): string {
  const label = names.length === 1 ? "Unknown placeholder" : "Unknown placeholders";
  return `${label}: ${names.map((name) => `{${name}}`).join(", ")}. Use ${PLACEHOLDER_LIST}.`;
}

/**
 * Builds the template form schema for an SMS prefix: a trimmed name (2–60
 * characters), an optional hazard type (`undefined` means any hazard), and a
 * trimmed body with `\n` line breaks that uses only known placeholders and fits within
 * {@link SMS_MAX_CHARS} characters once the prefix is added.
 *
 * @param prefix - The SMS prefix, such as `Mi-isi FA:`; passed in because it comes from the environment.
 * @returns A zod schema for the template form.
 */
export function makeTemplateSchema(prefix: string) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, "Enter at least 2 characters.")
      .max(60, "Use 60 characters or fewer."),
    hazardType: z.enum(HazardType, { error: "Choose a hazard type." }).optional(),
    body: z
      .string()
      // Browsers submit textarea line breaks as CRLF; store and count them as one character, like the counter.
      .overwrite((body) => body.replace(/\r\n?/g, "\n"))
      .trim()
      .min(1, "Enter the message.")
      .superRefine((body, ctx) => {
        const unknown = findUnknownPlaceholders(body);
        if (unknown.length > 0) {
          ctx.addIssue({ code: "custom", message: unknownPlaceholderMessage(unknown) });
        }
        const length = withPrefix(body, prefix).length;
        if (length > SMS_MAX_CHARS) {
          ctx.addIssue({
            code: "custom",
            message: `The message is ${length} characters with the "${prefix}" prefix; the limit is ${SMS_MAX_CHARS}.`,
          });
        }
      }),
  });
}

/** A parsed, valid template form. */
export type TemplateInput = z.infer<ReturnType<typeof makeTemplateSchema>>;
