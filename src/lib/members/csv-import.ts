import Papa from "papaparse";
import type { z } from "zod";

import { memberInputSchema, type MemberInput } from "@/lib/validation/member";
import type { ImportRowError } from "@/types/member";

/** The columns every import file needs; `crops` is optional. */
const REQUIRED_COLUMNS = ["first_name", "last_name", "phone", "zone"] as const;

/** The UTF-8 byte order mark Excel puts at the start of a "CSV UTF-8" file. */
const BOM = String.fromCharCode(0xfeff);

type Column = (typeof REQUIRED_COLUMNS)[number] | "crops";

/** What {@link parseMemberCsv} needs from the database. */
export interface MemberCsvContext {
  /** Zone ids by zone name; names are matched ignoring case and surrounding spaces. */
  zoneIdByName: Map<string, string>;
  /** Canonical `+639…` numbers that already belong to a member. */
  existingPhones: Set<string>;
}

/** Result of {@link parseMemberCsv}. */
export interface MemberCsvResult {
  valid: MemberInput[];
  errors: ImportRowError[];
}

/**
 * Decodes an uploaded CSV. Excel's "CSV UTF-8" saves UTF-8, but its plain
 * "CSV (Comma delimited)" saves Windows-1252 on Windows, which UTF-8 decoding
 * would turn into `�` (so "Peña" would become "Pe�a"). Bytes that aren't
 * valid UTF-8 are read as Windows-1252 instead.
 *
 * @param bytes - The file's raw contents.
 * @returns The file's text.
 *
 * @example
 * decodeCsvBytes(new Uint8Array([0x50, 0x65, 0xf1, 0x61])); // "Peña"
 */
export function decodeCsvBytes(bytes: ArrayBuffer | Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function isBlank(cells: string[]): boolean {
  return cells.every((cell) => cell.trim() === "");
}

/** The message for a row's first schema issue, worded for a spreadsheet when it's the zone. */
function rowMessage(issue: z.core.$ZodIssue, zoneName: string): string {
  if (issue.path[0] !== "zoneId") return issue.message;
  return zoneName === ""
    ? "Enter the zone."
    : `Unknown zone "${zoneName}". Add it under Zones first.`;
}

/**
 * Checks a member CSV (header `first_name,last_name,phone,zone,crops`) row by
 * row. Rows fail for an invalid phone, an unknown zone, a number repeated
 * from an earlier row, or a number that is already registered. A UTF-8 BOM
 * and Excel's dropped leading `0` (`9171234567`) are handled, and blank rows
 * are skipped.
 *
 * @param text - The file's contents.
 * @param ctx - Known zones and registered numbers.
 * @returns The valid rows, each with `consent: true`, and one error per
 * failed row. Row numbers are 1-based spreadsheet rows, so the header is row 1.
 *
 * @example
 * parseMemberCsv("first_name,last_name,phone,zone\nJuan,Cruz,9171234567,purok 1", {
 *   zoneIdByName: new Map([["Purok 1", "z1"]]),
 *   existingPhones: new Set(),
 * }); // { valid: [{ firstName: "Juan", phone: "+639171234567", zoneId: "z1", … }], errors: [] }
 */
export function parseMemberCsv(text: string, ctx: MemberCsvContext): MemberCsvResult {
  // Parsed without `header` or `skipEmptyLines` so each record's index is
  // its spreadsheet row, even when blank rows sit between members.
  const content = text.startsWith(BOM) ? text.slice(1) : text;
  const { data } = Papa.parse<string[]>(content);
  const [header, ...rows] = data;
  if (!header || isBlank(header)) {
    return { valid: [], errors: [{ row: 1, message: "The file is empty." }] };
  }

  const columns = header.map(normalizeKey);
  const missing = REQUIRED_COLUMNS.find((column) => !columns.includes(column));
  if (missing) {
    return {
      valid: [],
      errors: [{ row: 1, message: `Missing the "${missing}" column. Use the CSV template.` }],
    };
  }

  const zoneIdByName = new Map(
    [...ctx.zoneIdByName].map(([name, id]) => [normalizeKey(name), id]),
  );
  const rowByPhone = new Map<string, number>();
  const valid: MemberInput[] = [];
  const errors: ImportRowError[] = [];

  rows.forEach((cells, index) => {
    const row = index + 2;
    if (isBlank(cells)) return;

    const cell = (column: Column) => cells[columns.indexOf(column)] ?? "";
    const zoneName = cell("zone").trim();
    const parsed = memberInputSchema.safeParse({
      firstName: cell("first_name"),
      lastName: cell("last_name"),
      phone: cell("phone"),
      zoneId: zoneIdByName.get(normalizeKey(zoneName)) ?? "",
      crops: cell("crops"),
      consent: true,
    });

    if (!parsed.success) {
      errors.push({ row, message: rowMessage(parsed.error.issues[0], zoneName) });
      return;
    }

    const { phone } = parsed.data;
    const earlierRow = rowByPhone.get(phone);
    if (earlierRow !== undefined) {
      errors.push({ row, message: `Duplicate of row ${earlierRow}.` });
    } else if (ctx.existingPhones.has(phone)) {
      errors.push({ row, message: "Already registered." });
    } else {
      rowByPhone.set(phone, row);
      valid.push(parsed.data);
    }
  });

  return { valid, errors };
}
