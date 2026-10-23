/** A message's delivery state as the SMS provider reports it. */
export type ProviderStatus = "pending" | "retrying" | "sent" | "failed";

/** One message of a blast, as reported by the SMS provider. */
export type ProviderMessage = {
  /** Provider reference, such as UniSMS `msg_…`. */
  referenceId: string;
  /** The number as the provider reports it; may be `09…` rather than `+639…`. */
  recipient: string;
  status: ProviderStatus;
  failReason: string | null;
  metadata: Record<string, unknown> | null;
};

/** One message sent to many numbers. */
export type BlastRequest = {
  recipients: string[];
  /** Final text, prefix included. */
  content: string;
  senderId: string;
  /** Echoed back on every message, e.g. `{ broadcastId }`. */
  metadata: Record<string, string>;
};

/** Outcome of {@link SmsGateway.blast}. */
export type BlastResult =
  | { kind: "ok"; blastId: string; queued: number; skipped: { recipient: string; reason: string }[] }
  | { kind: "rate_limited"; retryAfterMs: number }
  | { kind: "rejected"; status: number; message: string }
  | { kind: "network_error"; message: string };

/** The SMS provider, behind a small interface so drivers can be swapped. */
export interface SmsGateway {
  blast(req: BlastRequest): Promise<BlastResult>;
  getBlastMessages(blastId: string): Promise<ProviderMessage[]>;
  /** `null` when the balance is unknown or unavailable. */
  getCreditBalance(): Promise<number | null>;
}

/** Thrown when the SMS provider can't be reached or returns an unusable response. */
export class SmsGatewayError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SmsGatewayError";
  }
}
