import { describe, expect, it } from "vitest";

import { SMS_MAX_CHARS } from "@/lib/domain/sms-text";

import { makeTemplateSchema } from "./template";

const PREFIX = "Mi-isi FA:";
const schema = makeTemplateSchema(PREFIX);

function bodyErrors(body: string): string[] {
  const result = schema.safeParse({ name: "Ashfall advisory", body });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("makeTemplateSchema", () => {
  it("trims the name and body and leaves a missing hazard as any hazard", () => {
    expect(schema.parse({ name: "  All clear ", body: " {hazard} done. " })).toEqual({
      name: "All clear",
      hazardType: undefined,
      body: "{hazard} done.",
    });
  });

  it("rejects an unknown placeholder with the list of valid ones", () => {
    expect(bodyErrors("{hazrd} sa {zones}")).toEqual([
      "Unknown placeholder: {hazrd}. Use {hazard}, {level}, {zones} or {date}.",
    ]);
  });

  it("names every unknown placeholder once", () => {
    expect(bodyErrors("{a} {b} {a}")).toEqual([
      "Unknown placeholders: {a}, {b}. Use {hazard}, {level}, {zones} or {date}.",
    ]);
  });

  it("counts the prefix and its space toward the limit", () => {
    const fits = "x".repeat(SMS_MAX_CHARS - PREFIX.length - 1);
    expect(bodyErrors(fits)).toEqual([]);
    expect(bodyErrors(`${fits}x`)).toEqual([
      `The message is ${SMS_MAX_CHARS + 1} characters with the "${PREFIX}" prefix; the limit is ${SMS_MAX_CHARS}.`,
    ]);
  });

  it("stores CRLF line breaks as LF and counts them as one character", () => {
    const line = "x".repeat(SMS_MAX_CHARS - PREFIX.length - 2);
    // Exactly at the limit with LF; one over if CRLF counted as two.
    const body = `${line.slice(0, -1)}\r\ny`;
    expect(schema.parse({ name: "Two lines", body }).body).toBe(`${line.slice(0, -1)}\ny`);
  });

  it("requires a body and a 2-character name", () => {
    const result = schema.safeParse({ name: " a ", body: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => [issue.path[0], issue.message])).toEqual([
      ["name", "Enter at least 2 characters."],
      ["body", "Enter the message."],
    ]);
  });

  it("rejects a hazard type that isn't in the enum", () => {
    const result = schema.safeParse({ name: "Ashfall", hazardType: "METEOR", body: "x" });
    expect(result.error?.issues[0].message).toBe("Choose a hazard type.");
  });
});
