import { Prisma } from "@/generated/prisma/client";

interface DriverAdapterErrorMeta {
  cause?: { constraint?: { fields?: string[]; index?: string } };
}

/**
 * Lists the columns named in a unique-constraint error. Prisma's query engine
 * reports them in `meta.target`; driver adapters (such as Neon's) report them
 * in `meta.driverAdapterError.cause.constraint`, as quoted columns or an index name.
 */
function uniqueViolationTargets(meta: Record<string, unknown> | undefined): string[] {
  const target = meta?.target;
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === "string") return [target];

  const constraint = (meta?.driverAdapterError as DriverAdapterErrorMeta | undefined)?.cause
    ?.constraint;
  if (constraint?.fields) return constraint.fields.map((column) => column.replaceAll('"', ""));
  // Prisma names unique indexes `<table>_<column>_key`.
  if (constraint?.index) return constraint.index.split("_");
  return [];
}

/**
 * Checks whether an error is a Prisma unique-constraint violation (`P2002`)
 * on a given field.
 *
 * @param e - Anything caught from a Prisma call.
 * @param field - The column to look for, such as `"name"`.
 * @returns `true` only for a `P2002` error whose target includes `field`.
 */
export function isUniqueViolation(e: unknown, field: string): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  return uniqueViolationTargets(e.meta).includes(field);
}
