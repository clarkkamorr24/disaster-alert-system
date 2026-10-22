import { describe, expect, it } from "vitest";

import { INVALID_PHONE_MESSAGE, memberInputSchema, memberUpdateSchema } from "./member";

const valid = { firstName: "Juan", lastName: "Dela Cruz", phone: "09171234567", zoneId: "z1", consent: true };

describe("memberInputSchema", () => {
  it("trims names and normalizes the phone", () => {
    const m = memberInputSchema.parse({ ...valid, firstName: " Juan ", phone: "0917-123-4567" });
    expect(m).toMatchObject({ firstName: "Juan", phone: "+639171234567" });
  });

  it("requires consent", () => {
    expect(memberInputSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("rejects a landline with the PH mobile message on phone", () => {
    const parsed = memberInputSchema.safeParse({ ...valid, phone: "(052) 820-1234" });
    expect(parsed.success).toBe(false);
    expect(parsed.error!.issues).toEqual([
      expect.objectContaining({ path: ["phone"], message: INVALID_PHONE_MESSAGE }),
    ]);
  });

  it("turns blank optional fields into undefined", () => {
    const m = memberInputSchema.parse({ ...valid, crops: "  ", notes: "" });
    expect(m.crops).toBeUndefined();
    expect(m.notes).toBeUndefined();
  });

  it("rejects blank names, a missing zone, and over-long notes", () => {
    const parsed = memberInputSchema.safeParse({
      ...valid,
      firstName: "  ",
      zoneId: "",
      notes: "x".repeat(501),
    });
    expect(parsed.error!.issues.map((issue) => issue.path[0])).toEqual([
      "firstName",
      "zoneId",
      "notes",
    ]);
  });
});

describe("memberUpdateSchema", () => {
  it("does not ask for consent", () => {
    const { firstName, lastName, phone, zoneId } = valid;
    expect(memberUpdateSchema.safeParse({ firstName, lastName, phone, zoneId }).success).toBe(true);
  });
});
