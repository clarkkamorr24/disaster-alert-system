import type { AlertStatus, Severity } from "@/generated/prisma/enums";

/** A member found by the header search. */
export interface MemberSearchResult {
  id: string;
  name: string;
  /** Formatted for display, such as `0917 123 4567`. */
  phone: string;
  zoneName: string;
  isActive: boolean;
}

/** An alert found by the header search. */
export interface AlertSearchResult {
  id: string;
  title: string;
  severity: Severity;
  status: AlertStatus;
}

/** A broadcast found by the header search. */
export interface BroadcastSearchResult {
  id: string;
  /** From `broadcastTitle`: the alert title or the start of the message. */
  title: string;
  createdAt: Date;
}

/** Everything the header search returns for one query. */
export interface SearchResults {
  members: MemberSearchResult[];
  alerts: AlertSearchResult[];
  broadcasts: BroadcastSearchResult[];
}
