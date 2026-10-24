"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { isUniqueViolation } from "@/lib/prisma-errors";
import {
  DUPLICATE_PHONE_MESSAGE,
  memberInputSchema,
  memberUpdateSchema,
} from "@/lib/validation/member";
import type { ActionResult } from "@/types/action-result";

const INVALID_FIELDS = "Check the highlighted fields.";
const DUPLICATE_PHONE: ActionResult = {
  success: false,
  error: INVALID_FIELDS,
  fieldErrors: { phone: [DUPLICATE_PHONE_MESSAGE] },
};

/** The text the officer must type to delete a member permanently. */
const DELETE_CONFIRMATION = "DELETE";

type Parsed<T> = { success: true; data: T } | { success: false; result: ActionResult };

function readMemberForm(formData: FormData) {
  return {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    zoneId: String(formData.get("zoneId") ?? ""),
    crops: String(formData.get("crops") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    consent: formData.get("consent") === "on",
  };
}

function parseWith<T>(schema: z.ZodType<T>, formData: FormData): Parsed<T> {
  const parsed = schema.safeParse(readMemberForm(formData));
  if (parsed.success) return { success: true, data: parsed.data };
  return {
    success: false,
    result: {
      success: false,
      error: INVALID_FIELDS,
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    },
  };
}

/**
 * Adds a member from the member form and records consent now. Redirects to
 * `/members`, unless the form sends `stay=1` (the Add member pop-up): then it
 * returns the new member's id and the current page refreshes in place.
 */
export async function createMember(
  _prev: ActionResult<{ id: string } | void> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string } | void>> {
  await requireOfficer();

  const parsed = parseWith(memberInputSchema, formData);
  if (!parsed.success) return parsed.result;

  const { firstName, lastName, phone, zoneId, crops, notes } = parsed.data;
  let id: string;
  try {
    ({ id } = await prisma.member.create({
      data: { firstName, lastName, phone, zoneId, crops, notes, consentAt: new Date() },
      select: { id: true },
    }));
  } catch (error) {
    if (isUniqueViolation(error, "phone")) return DUPLICATE_PHONE;
    console.error("createMember failed", error);
    return { success: false, error: "Couldn't add the member. Try again." };
  }

  revalidatePath("/members", "layout");
  if (formData.get("stay") === "1") return { success: true, data: { id } };
  redirect("/members");
}

/** Saves the member form over an existing member. Bind the member id as the first argument. */
export async function updateMember(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOfficer();

  const parsed = parseWith(memberUpdateSchema, formData);
  if (!parsed.success) return parsed.result;

  try {
    // Cleared optional fields are stored as null.
    await prisma.member.update({
      where: { id },
      data: { ...parsed.data, crops: parsed.data.crops ?? null, notes: parsed.data.notes ?? null },
    });
  } catch (error) {
    if (isUniqueViolation(error, "phone")) return DUPLICATE_PHONE;
    console.error("updateMember failed", error);
    return { success: false, error: "Couldn't save the member. Try again." };
  }

  revalidatePath("/members", "layout");
  return { success: true, data: undefined };
}

/** Deactivates or reactivates a member. Inactive members receive no SMS. */
export async function setMemberActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireOfficer();

  try {
    await prisma.member.update({ where: { id }, data: { isActive } });
  } catch (error) {
    console.error("setMemberActive failed", error);
    return { success: false, error: "Couldn't update the member. Try again." };
  }

  revalidatePath("/members", "layout");
  return { success: true, data: undefined };
}

/**
 * Permanently deletes a member who asked to be removed (RA 10173), then
 * redirects to `/members`, unless `stay` is set (the list's row menu): then the
 * current page, with its filters, refreshes in place. Refused unless
 * `confirmation` is exactly `DELETE`. Past delivery reports keep their phone
 * and name snapshot; their `memberId` becomes null.
 */
export async function deleteMember(
  id: string,
  confirmation: string,
  { stay = false }: { stay?: boolean } = {},
): Promise<ActionResult> {
  await requireOfficer();

  if (confirmation !== DELETE_CONFIRMATION) {
    return { success: false, error: `Type ${DELETE_CONFIRMATION} to confirm.` };
  }

  try {
    await prisma.member.delete({ where: { id } });
  } catch (error) {
    console.error("deleteMember failed", error);
    return { success: false, error: "Couldn't delete the member. Try again." };
  }

  revalidatePath("/members", "layout");
  if (stay) return { success: true, data: undefined };
  redirect("/members");
}
