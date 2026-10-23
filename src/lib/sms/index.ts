import "server-only";

import { getEnv } from "@/lib/env";
import { createFakeGateway } from "@/lib/sms/fake";
import { createUniSmsGateway } from "@/lib/sms/unisms";
import type { SmsGateway } from "@/types/sms";

/**
 * Returns the SMS gateway selected by `SMS_DRIVER`: UniSMS for `"unisms"`,
 * otherwise the fake test-mode driver.
 *
 * @returns The gateway to send and track messages with.
 */
export function getSmsGateway(): SmsGateway {
  const env = getEnv();
  if (env.SMS_DRIVER === "unisms") {
    // getEnv() already requires the key for this driver; this narrows the type.
    if (!env.UNISMS_API_KEY) throw new Error("UNISMS_API_KEY is required when SMS_DRIVER is \"unisms\".");
    return createUniSmsGateway(env.UNISMS_API_KEY);
  }
  return createFakeGateway();
}

/**
 * Whether the app runs in test mode (`SMS_DRIVER=fake`), where no SMS is
 * really sent.
 *
 * @returns `true` for the fake driver.
 */
export function isTestMode(): boolean {
  return getEnv().SMS_DRIVER === "fake";
}
