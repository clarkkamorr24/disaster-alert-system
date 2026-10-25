"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { zoneInputSchema, type ZoneInput } from "@/lib/validation/zone";
import type { ActionResult } from "@/types/action-result";

const INVALID_FIELDS = "Check the highlighted fields.";
const DUPLICATE_NAME: ActionResult = {
  success: false,
  error: INVALID_FIELDS,
  fieldErrors: { name: ["A zone with this name already exists."] },
};

type ParsedZone = { success: true; data: ZoneInput } | { success: false; result: ActionResult };

function parseZoneForm(formData: FormData): ParsedZone {
  const parsed = zoneInputSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    latitude: String(formData.get("latitude") ?? ""),
    longitude: String(formData.get("longitude") ?? ""),
    boundary: String(formData.get("boundary") ?? ""),
    color: String(formData.get("color") ?? ""),
  });
  if (parsed.success) return { success: true, data: parsed.data };
  return {
    success: false,
    result: {
      success: false,
      error: INVALID_FIELDS,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    },
  };
}

/** Creates a zone from the zone form, then redirects to `/zones`. */
export async function createZone(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOfficer();

  const parsed = parseZoneForm(formData);
  if (!parsed.success) return parsed.result;

  try {
    await prisma.farmZone.create({ data: parsed.data });
  } catch (error) {
    if (isUniqueViolation(error, "name")) return DUPLICATE_NAME;
    console.error("createZone failed", error);
    return { success: false, error: "Couldn't add the zone. Try again." };
  }

  revalidatePath("/zones", "layout");
  redirect("/zones");
}

/** Saves the zone form over an existing zone. Bind the zone id as the first argument. */
export async function updateZone(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOfficer();

  const parsed = parseZoneForm(formData);
  if (!parsed.success) return parsed.result;

  try {
    // A cleared description, boundary, or color is stored as null.
    await prisma.farmZone.update({
      where: { id },
      data: {
        ...parsed.data,
        description: parsed.data.description ?? null,
        boundary: parsed.data.boundary ?? Prisma.DbNull,
        color: parsed.data.color ?? null,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error, "name")) return DUPLICATE_NAME;
    console.error("updateZone failed", error);
    return { success: false, error: "Couldn't save the zone. Try again." };
  }

  revalidatePath("/zones", "layout");
  return { success: true, data: undefined };
}

/**
 * Deletes a zone that has no members, then redirects to `/zones`.
 * Inactive members count too, since the database keeps every member's zone.
 */
export async function deleteZone(id: string): Promise<ActionResult> {
  await requireOfficer();

  try {
    const memberCount = await prisma.member.count({ where: { zoneId: id } });
    if (memberCount > 0) {
      return { success: false, error: "Move or remove this zone's members first." };
    }
    await prisma.farmZone.delete({ where: { id } });
  } catch (error) {
    console.error("deleteZone failed", error);
    return { success: false, error: "Couldn't delete the zone. Try again." };
  }

  revalidatePath("/zones", "layout");
  redirect("/zones");
}
