import type { HazardType, Severity } from "@/generated/prisma/enums";

/** Which alerts the alert log shows. */
export type AlertTab = "all" | "active" | "resolved";

/** The alert log's tab, search, filters, and page, read from the URL. */
export interface AlertListFilters {
  tab: AlertTab;
  q: string;
  /** A hazard type, or `null` for every hazard. */
  hazard: HazardType | null;
  /** A severity, or `null` for every severity. */
  severity: Severity | null;
  /** 1-based. */
  page: number;
}

/** What the New alert form sends: the alert, and the SMS when `send` is true. */
export interface AlertSendInput {
  /** One per New alert form; used for the alert and for its broadcast. */
  idempotencyKey: string;
  title: string;
  hazardType: HazardType | null;
  severity: Severity | null;
  officialLevel: string;
  description: string;
  zoneIds: string[];
  /** `false` logs the alert without an SMS. */
  send: boolean;
  /** The SMS as typed, without the prefix. Ignored when `send` is false. */
  content: string;
}

/**
 * What `createAlertAndSend` returns when it doesn't redirect. `alertId` is set
 * when the alert was logged but its SMS wasn't sent.
 */
export interface AlertSendFailure {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
  alertId?: string;
}
