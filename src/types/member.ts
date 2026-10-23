/** A saved member, as the edit form needs it. */
export interface MemberFormValues {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  zoneId: string;
  crops: string | null;
  notes: string | null;
}

/** A zone choice in the member form and filters. */
export interface ZoneOption {
  id: string;
  name: string;
}

/** Which members the list shows by active state. */
export type MemberStatusFilter = "active" | "inactive" | "all";

/** The member list's search, filters, and page, read from the URL. */
export interface MemberListFilters {
  q: string;
  /** A zone id, or `undefined` for all zones. */
  zoneId: string | undefined;
  status: MemberStatusFilter;
  /** 1-based. */
  page: number;
}

/** A row of a member CSV that can't be imported. */
export interface ImportRowError {
  /** 1-based spreadsheet row; the header is row 1. */
  row: number;
  message: string;
}

/** What checking a member CSV found. */
export interface MemberImportPreview {
  validCount: number;
  errors: ImportRowError[];
}
