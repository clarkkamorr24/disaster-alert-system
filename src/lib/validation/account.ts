import { z } from "zod";

/** Shortest password the officer account accepts. */
export const PASSWORD_MIN_LENGTH = 10;

/** bcrypt ignores everything past 72 bytes, so longer passwords are rejected rather than silently truncated. */
export const PASSWORD_MAX_BYTES = 72;

/**
 * A new password for the officer account: at least {@link PASSWORD_MIN_LENGTH}
 * characters and at most {@link PASSWORD_MAX_BYTES} bytes (UTF-8).
 */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .refine(
    (value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES,
    "Use a shorter password (72 characters at most, fewer with accented letters or emoji).",
  );

/** The Profile form: the officer's display name and sign-in email (trimmed and lowercased). */
export const accountProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(80, "Use 80 characters or fewer."),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
});

/**
 * The Change password form. The confirmation must match, and the new password
 * must differ from the current one.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.confirmPassword === data.newPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Choose a password you haven't used here.",
    path: ["newPassword"],
  });
