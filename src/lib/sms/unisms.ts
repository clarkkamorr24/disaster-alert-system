import "server-only";

import { z } from "zod";

import {
  SmsGatewayError,
  type BlastRequest,
  type BlastResult,
  type ProviderMessage,
  type SmsGateway,
} from "@/types/sms";

const DEFAULT_BASE_URL = "https://unismsapi.com/api";
const TIMEOUT_MS = 15_000;
const DEFAULT_RETRY_AFTER_MS = 2_000;

const blastResponseSchema = z.object({
  blast_id: z.string(),
  queued: z.number(),
  skipped: z.array(z.object({ recipient: z.string(), errors: z.unknown() })).default([]),
});

const messageSchema = z.object({
  reference_id: z.string(),
  recipient: z.string(),
  // An unknown status means no delivery report we understand yet.
  status: z.enum(["pending", "retrying", "sent", "failed"]).catch("pending"),
  fail_reason: z.string().nullish(),
  // PHP APIs often encode empty metadata as `[]`; anything that isn't an object counts as none.
  metadata: z.record(z.string(), z.unknown()).nullish().catch(null),
});

const blastMessagesSchema = z.object({ messages: z.array(z.unknown()) });

const accountSchema = z.object({ sms_credits: z.number() });

/**
 * Turns a UniSMS `errors` value into readable text. UniSMS sends either a
 * string or field errors such as `{ recipient: ["This Sender ID can't …"] }`.
 */
function describeErrors(errors: unknown): string {
  if (typeof errors === "string") return errors;
  if (errors && typeof errors === "object") {
    const messages = Object.values(errors)
      .flat()
      .filter((m): m is string => typeof m === "string");
    if (messages.length > 0) return messages.join(" ");
  }
  return JSON.stringify(errors);
}

/** Reads a JSON body, or `null` when there is none or it isn't JSON. */
async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Converts one UniSMS message object (from `GET /blast/:id` or a delivery
 * webhook) to a {@link ProviderMessage}. An unrecognized status becomes
 * `pending`.
 *
 * @param raw - The message object as UniSMS sent it.
 * @returns The message with camelCase fields.
 * @throws SmsGatewayError when `raw` lacks `reference_id` or `recipient`.
 */
export function mapUniSmsMessage(raw: unknown): ProviderMessage {
  const parsed = messageSchema.safeParse(raw);
  if (!parsed.success) {
    throw new SmsGatewayError("UniSMS sent a message in an unexpected format.", {
      cause: parsed.error,
    });
  }
  const msg = parsed.data;
  return {
    referenceId: msg.reference_id,
    recipient: msg.recipient,
    status: msg.status,
    failReason: msg.fail_reason ?? null,
    metadata: msg.metadata ?? null,
  };
}

/**
 * Creates an {@link SmsGateway} backed by the UniSMS REST API.
 *
 * Requests use HTTP Basic auth (the API key as username, empty password),
 * skip the Next.js fetch cache, and time out after 15 seconds.
 *
 * @param apiKey - The UniSMS API secret key.
 * @param baseUrl - API root, overridable for tests.
 * @returns The UniSMS gateway.
 */
export function createUniSmsGateway(apiKey: string, baseUrl = DEFAULT_BASE_URL): SmsGateway {
  const headers = {
    Authorization: "Basic " + btoa(apiKey + ":"),
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  function request(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(baseUrl + path, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }

  return {
    async blast(req: BlastRequest): Promise<BlastResult> {
      let res: Response;
      try {
        res = await request("/blast", {
          method: "POST",
          body: JSON.stringify({
            recipients: req.recipients,
            content: req.content,
            sender_id: req.senderId,
            metadata: req.metadata,
          }),
        });
      } catch (error) {
        return { kind: "network_error", message: error instanceof Error ? error.message : String(error) };
      }

      if (res.status === 429) {
        const retryAfterMs = Number(res.headers.get("x-retry-after-ms")) || DEFAULT_RETRY_AFTER_MS;
        return { kind: "rate_limited", retryAfterMs };
      }

      const body = await readJson(res);
      if (!res.ok) {
        const errors = body && typeof body === "object" && "errors" in body ? body.errors : undefined;
        return {
          kind: "rejected",
          status: res.status,
          // statusText is empty over HTTP/2, so fall back to the status code.
          message: errors == null ? res.statusText || `UniSMS returned ${res.status}.` : describeErrors(errors),
        };
      }

      const parsed = blastResponseSchema.safeParse(body);
      if (!parsed.success) {
        // Accepted but unreadable: UniSMS may have queued the messages, so don't report a rejection.
        return { kind: "network_error", message: "UniSMS sent an unexpected response." };
      }
      return {
        kind: "ok",
        blastId: parsed.data.blast_id,
        queued: parsed.data.queued,
        skipped: parsed.data.skipped.map((s) => ({
          recipient: s.recipient,
          reason: describeErrors(s.errors),
        })),
      };
    },

    async getBlastMessages(blastId: string): Promise<ProviderMessage[]> {
      let res: Response;
      try {
        res = await request(`/blast/${encodeURIComponent(blastId)}`);
      } catch (error) {
        throw new SmsGatewayError("Couldn't reach UniSMS.", { cause: error });
      }
      if (!res.ok) {
        throw new SmsGatewayError(`UniSMS returned ${res.status} for blast ${blastId}.`);
      }

      const parsed = blastMessagesSchema.safeParse(await readJson(res));
      if (!parsed.success) {
        throw new SmsGatewayError("UniSMS sent an unexpected response.", { cause: parsed.error });
      }
      return parsed.data.messages.map(mapUniSmsMessage);
    },

    async getCreditBalance(): Promise<number | null> {
      try {
        const res = await request("/account");
        if (!res.ok) return null;
        const parsed = accountSchema.safeParse(await readJson(res));
        return parsed.success ? parsed.data.sms_credits : null;
      } catch {
        return null;
      }
    },
  };
}
