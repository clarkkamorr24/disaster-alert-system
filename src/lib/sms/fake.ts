import type { BlastRequest, BlastResult, ProviderMessage, SmsGateway } from "@/types/sms";

/** Reason given for numbers the fake driver pretends it can't reach. */
export const FAKE_SKIP_REASON = "Simulated: network not reachable";

const FAKE_CREDIT_BALANCE = 1_000_000;

// Kept on globalThis so stored blasts survive dev hot reload.
const globalForFakeSms = globalThis as unknown as { fakeSmsBlasts?: Map<string, ProviderMessage[]> };
const blasts = (globalForFakeSms.fakeSmsBlasts ??= new Map<string, ProviderMessage[]>());

/**
 * Creates the test-mode {@link SmsGateway}. It sends nothing: numbers ending
 * in `0000` are reported as skipped, so the "Not reached" flow can be shown,
 * and every other number is stored in memory as `sent`.
 *
 * @returns The fake gateway, with a balance of 1,000,000 credits.
 */
export function createFakeGateway(): SmsGateway {
  return {
    async blast(req: BlastRequest): Promise<BlastResult> {
      const skipped: { recipient: string; reason: string }[] = [];
      const messages: ProviderMessage[] = [];

      for (const recipient of req.recipients) {
        if (recipient.endsWith("0000")) {
          skipped.push({ recipient, reason: FAKE_SKIP_REASON });
        } else {
          messages.push({
            referenceId: "msg_fake_" + crypto.randomUUID(),
            recipient,
            status: "sent",
            failReason: null,
            metadata: { ...req.metadata },
          });
        }
      }

      const blastId = "fake_" + crypto.randomUUID();
      blasts.set(blastId, messages);
      return { kind: "ok", blastId, queued: messages.length, skipped };
    },

    async getBlastMessages(blastId: string): Promise<ProviderMessage[]> {
      return blasts.get(blastId) ?? [];
    },

    async getCreditBalance(): Promise<number | null> {
      return FAKE_CREDIT_BALANCE;
    },
  };
}
