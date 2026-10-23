import { describe, expect, it } from "vitest";

import { decodeCsvBytes, parseMemberCsv } from "./csv-import";

const BOM = String.fromCharCode(0xfeff);
const HEADER = "first_name,last_name,phone,zone,crops";
const ctx = (existing: string[] = []) => ({
  zoneIdByName: new Map([[" Purok 1 ", "z1"]]),
  existingPhones: new Set(existing),
});

describe("parseMemberCsv", () => {
  it("accepts valid rows and reports each bad row with its spreadsheet row number", () => {
    const csv = `${BOM}${HEADER}\nJuan,Cruz,9171234567,purok 1,rice\nAna,Reyes,9.17E+09,Purok 1,\nLeo,Santos,09181234567,Purok 9,\nMia,Lim,09171234567,Purok 1,`;
    const r = parseMemberCsv(csv, ctx());

    expect(r.valid).toHaveLength(1);
    expect(r.valid[0]).toMatchObject({
      firstName: "Juan",
      lastName: "Cruz",
      phone: "+639171234567",
      zoneId: "z1",
      crops: "rice",
      consent: true,
    });
    expect(r.errors.map((e) => e.row)).toEqual([3, 4, 5]);
    expect(r.errors[0].message).toMatch(/phone|mobile/i);
    expect(r.errors[1].message).toBe('Unknown zone "Purok 9". Add it under Zones first.');
    expect(r.errors[2].message).toBe("Duplicate of row 2.");
  });

  it("rejects numbers that are already registered, every time they appear", () => {
    const csv = `${HEADER}\nJuan,Cruz,0917 123 4567,Purok 1,\nAna,Reyes,+639171234567,Purok 1,`;
    const r = parseMemberCsv(csv, ctx(["+639171234567"]));
    expect(r.valid).toEqual([]);
    expect(r.errors).toEqual([
      { row: 2, message: "Already registered." },
      { row: 3, message: "Already registered." },
    ]);
  });

  it("keeps row numbers right across blank rows, CRLF endings, and reordered columns", () => {
    const csv = "Zone, Phone ,First_Name,Last_Name\r\n\r\nPurok 1,09171234567,Juan,Cruz\r\n,,,\r\nPurok 1,123,Ana,Reyes\r\n";
    const r = parseMemberCsv(csv, ctx());
    expect(r.valid).toHaveLength(1);
    expect(r.valid[0].crops).toBeUndefined();
    expect(r.errors).toEqual([{ row: 5, message: expect.stringMatching(/mobile/i) }]);
  });

  it("names a missing required column on the header row", () => {
    const r = parseMemberCsv("first_name,last_name,zone\nJuan,Cruz,Purok 1", ctx());
    expect(r).toEqual({
      valid: [],
      errors: [{ row: 1, message: 'Missing the "phone" column. Use the CSV template.' }],
    });
  });

  it("reports an empty file", () => {
    expect(parseMemberCsv(BOM, ctx()).errors).toEqual([
      { row: 1, message: "The file is empty." },
    ]);
  });

  it("asks for the zone when the cell is blank", () => {
    const r = parseMemberCsv(`${HEADER}\nJuan,Cruz,09171234567, ,`, ctx());
    expect(r.errors).toEqual([{ row: 2, message: "Enter the zone." }]);
  });

  it("uses the first problem in the row, such as a missing name", () => {
    const r = parseMemberCsv(`${HEADER}\n,Cruz,bad,Purok 9,`, ctx());
    expect(r.errors).toEqual([{ row: 2, message: "Enter the first name." }]);
  });
});

describe("decodeCsvBytes", () => {
  it("reads UTF-8, with or without a BOM", () => {
    const bytes = new TextEncoder().encode(`${BOM}Peña,Sto. Niño`);
    expect(decodeCsvBytes(bytes)).toBe("Peña,Sto. Niño");
  });

  it("falls back to Windows-1252 for Excel's plain CSV save", () => {
    // "Peña,Sto. Niño" with ñ as the single byte 0xF1.
    const bytes = new Uint8Array([
      0x50, 0x65, 0xf1, 0x61, 0x2c, 0x53, 0x74, 0x6f, 0x2e, 0x20, 0x4e, 0x69, 0xf1, 0x6f,
    ]);
    expect(decodeCsvBytes(bytes)).toBe("Peña,Sto. Niño");
  });
});
