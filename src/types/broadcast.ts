import type { HazardType, RecipientStatus } from "@/generated/prisma/enums";

/** One member a broadcast goes to, snapshotted at send time. */
export type Recipient = {
  memberId: string | null;
  /** Canonical `+639XXXXXXXXX`. */
  phone: string;
  name: string;
};

/** What {@link sendBroadcast} needs to create and send a broadcast. */
export type SendBroadcastInput = {
  /** One per compose form; a repeat with the same key sends nothing. */
  idempotencyKey: string;
  /** Final text, prefix included. */
  content: string;
  alertId: string | null;
  /** The broadcast this one resends to, if any. */
  retryOfId: string | null;
  recipients: Recipient[];
};

/** A status change for one recipient of a broadcast, matched on phone. */
export type RecipientUpdate = {
  phone: string;
  status: RecipientStatus;
  /** `undefined` leaves the stored value as is. */
  failReason?: string | null;
  /** `undefined` leaves the stored value as is. */
  providerRef?: string | null;
};

/** Where broadcasts and their recipients are stored. */
export interface BroadcastStore {
  findIdByIdempotencyKey(key: string): Promise<string | null>;
  /**
   * Creates the broadcast with every recipient `PENDING`. When another submit
   * already used the idempotency key, returns that broadcast's id with
   * `created: false`.
   */
  create(
    input: SendBroadcastInput & { senderId: string; creditsPerRecipient: number },
  ): Promise<{ id: string; created: boolean }>;
  addBlastId(broadcastId: string, blastId: string): Promise<void>;
  updateRecipients(broadcastId: string, updates: RecipientUpdate[]): Promise<void>;
}

/** A zone the compose form can send to. */
export interface ComposeZone {
  id: string;
  name: string;
  activeMemberCount: number;
}

/** A template the compose form can start from. */
export interface ComposeTemplate {
  id: string;
  name: string;
  hazardType: HazardType | null;
  body: string;
}

/** The alert a broadcast is about, as the compose form needs it. */
export interface ComposeAlert {
  id: string;
  title: string;
  hazardType: HazardType;
  /** Hazard label, such as `Volcanic eruption`. */
  hazard: string;
  /** Official level, or `""` when none was given. */
  level: string;
  zoneIds: string[];
  zoneNames: string[];
}

/** What the compose form sends to {@link sendBroadcastAction}. */
export interface SendBroadcastActionInput {
  idempotencyKey: string;
  /** The message as typed, without the prefix. */
  content: string;
  alertId: string | null;
  zoneIds: string[];
}
