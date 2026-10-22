import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";

import { isUniqueViolation } from "./prisma-errors";

function prismaError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError("failed", { code, clientVersion: "7", meta });
}

describe("isUniqueViolation", () => {
  it("matches the field in the query engine's meta.target", () => {
    expect(isUniqueViolation(prismaError("P2002", { target: ["name"] }), "name")).toBe(true);
  });

  it("matches the field in a driver adapter's constraint, with quotes stripped", () => {
    const error = prismaError("P2002", {
      driverAdapterError: { cause: { constraint: { fields: ['"idempotencyKey"'] } } },
    });
    expect(isUniqueViolation(error, "idempotencyKey")).toBe(true);
  });

  it("matches the field inside a driver adapter's index name", () => {
    const error = prismaError("P2002", {
      driverAdapterError: { cause: { constraint: { index: "farm_zone_name_key" } } },
    });
    expect(isUniqueViolation(error, "name")).toBe(true);
  });

  it("is false for a different field", () => {
    expect(isUniqueViolation(prismaError("P2002", { target: ["phone"] }), "name")).toBe(false);
  });

  it("is false for other Prisma errors and non-Prisma errors", () => {
    expect(isUniqueViolation(prismaError("P2003", { target: ["name"] }), "name")).toBe(false);
    expect(isUniqueViolation(new Error("P2002"), "name")).toBe(false);
    expect(isUniqueViolation(null, "name")).toBe(false);
  });
});
