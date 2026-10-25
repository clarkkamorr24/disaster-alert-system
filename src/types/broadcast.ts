import type { HazardType, RecipientStatus } from "@/generated/prisma/enums";
import type { PageSize } from "@/lib/pagination";

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
  /** The template the message started from, if any. */
  templateId: string | null;
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
  /** Applies each update unless it would move the recipient's status backwards. */
  updateRecipients(broadcastId: string, updates: RecipientUpdate[]): Promise<void>;
}

/** Where delivery reports read and write recipient statuses. */
export type DeliveryStore = Pick<BroadcastStore, "updateRecipients"> & {
  /** `null` when the broadcast has no recipient with this phone. */
  getRecipientStatus(broadcastId: string, phone: string): Promise<RecipientStatus | null>;
};

/** A broadcast's overall status, derived from its recipients' statuses. */
export type BroadcastStatus = "SENDING" | "COMPLETED" | "PARTIAL" | "FAILED";

/** One recipient as the delivery report shows it. */
export interface ReportRecipient {
  id: string;
  /** Snapshot at send time. */
  name: string;
  /** Snapshot at send time, canonical `+639…`. */
  phone: string;
  status: RecipientStatus;
  failReason: string | null;
  /** The member's current zone, or `null` when the member was deleted. */
  zoneName: string | null;
  /** When the status last changed. */
  updatedAt: Date;
  /** How many broadcasts of the resend chain, up to this one, included this phone. */
  attempts: number;
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

/** The unreached members a resend goes to, as the compose form needs them. */
export interface ComposeResend {
  retryOfId: string;
  memberCount: number;
  /** The zones those members live in, sorted. */
  zoneNames: string[];
  /** When the original was sent, formatted in Philippine time. */
  originalSentAt: string;
}

/**
 * What the compose form sends to {@link sendBroadcastAction}: zones to send
 * to, or, for a resend, the broadcast whose unreached members get it.
 */
export type SendBroadcastActionInput = {
  idempotencyKey: string;
  /** The message as typed, without the prefix. */
  content: string;
  /** The template the message started from; omitted or `null` when none was chosen. */
  templateId?: string | null;
} & ({ alertId: string | null; zoneIds: string[] } | { retryOfId: string });

/** Which broadcasts the history shows: all, those about an alert, announcements, or resends. */
export type BroadcastKind = "all" | "alert" | "announcement" | "resend";

/** The broadcast history's search, kind, and page, read from the URL. */
export interface BroadcastListFilters {
  q: string;
  kind: BroadcastKind;
  /** 1-based. */
  page: number;
  /** Rows per page, one of `PAGE_SIZES`. */
  size: PageSize;
}

/** Which recipients the delivery report lists. */
export type ReportView = "all" | "unreached" | "pending";
