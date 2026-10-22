import { z } from "zod";

const value = z.string().trim();

const envSchema = z
  .object({
    DATABASE_URL: value,
    AUTH_SECRET: value,
    SMS_DRIVER: value.pipe(z.enum(["unisms", "fake"])).default("fake"),
    UNISMS_API_KEY: value.optional(),
    UNISMS_SENDER_ID: value.default("Unisoft"),
    UNISMS_WEBHOOK_SECRET: value.optional(),
    SMS_MESSAGE_PREFIX: value.default("Mi-isi FA:"),
  })
  .superRefine(
    (env, ctx) => {
      if (env.SMS_DRIVER !== "unisms") return;
      for (const key of ["UNISMS_API_KEY", "UNISMS_WEBHOOK_SECRET"] as const) {
        if (!env[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is required when SMS_DRIVER is "unisms".`,
          });
        }
      }
    },
    // Run even when other variables failed, so one error names every missing variable.
    { when: () => true },
  );

/** Validated environment variables, with defaults applied. */
export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Reads and validates the environment variables the app needs.
 *
 * Parsing happens on the first call and the result is cached. `SMS_DRIVER`
 * defaults to `"fake"`, `UNISMS_SENDER_ID` to `"Unisoft"`, and
 * `SMS_MESSAGE_PREFIX` to `"Mi-isi FA:"`. `UNISMS_API_KEY` and
 * `UNISMS_WEBHOOK_SECRET` are required only when `SMS_DRIVER` is `"unisms"`.
 *
 * @returns The validated environment.
 * @throws Error naming every missing or invalid variable.
 */
export function getEnv(): Env {
  if (cached) return cached;

  // Blank values (e.g. `SMS_DRIVER=` copied from .env.example) count as unset.
  const provided = Object.fromEntries(
    Object.entries(process.env).filter(([, raw]) => raw !== undefined && raw.trim() !== ""),
  );
  const result = envSchema.safeParse(provided);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Missing or invalid environment variables: ${names.join(", ")}`);
  }

  cached = result.data;
  return cached;
}
