"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { copyName } from "@/lib/templates/copy-name";
import { makeTemplateSchema, type TemplateInput } from "@/lib/validation/template";
import type { ActionResult } from "@/types/action-result";

const INVALID_FIELDS = "Check the highlighted fields.";
const NAME_TAKEN = "A template with this name already exists.";
const DUPLICATE_NAME: ActionResult = {
  success: false,
  error: INVALID_FIELDS,
  fieldErrors: { name: [NAME_TAKEN] },
};

type ParsedTemplate = { success: true; data: TemplateInput } | { success: false; result: ActionResult };

function parseTemplateForm(formData: FormData): ParsedTemplate {
  const parsed = makeTemplateSchema(getEnv().SMS_MESSAGE_PREFIX).safeParse({
    name: String(formData.get("name") ?? ""),
    // "Any hazard" submits a blank value.
    hazardType: formData.get("hazardType") || undefined,
    body: String(formData.get("body") ?? ""),
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

/** Creates a template from the template form, then redirects to `/templates`. */
export async function createTemplate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOfficer();

  const parsed = parseTemplateForm(formData);
  if (!parsed.success) return parsed.result;

  try {
    await prisma.messageTemplate.create({ data: parsed.data });
  } catch (error) {
    if (isUniqueViolation(error, "name")) return DUPLICATE_NAME;
    console.error("createTemplate failed", error);
    return { success: false, error: "Couldn't add the template. Try again." };
  }

  revalidatePath("/templates", "layout");
  redirect("/templates");
}

/** Saves the template form over an existing template. Bind the template id as the first argument. */
export async function updateTemplate(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOfficer();

  const parsed = parseTemplateForm(formData);
  if (!parsed.success) return parsed.result;

  try {
    // "Any hazard" is stored as null.
    await prisma.messageTemplate.update({
      where: { id },
      data: { ...parsed.data, hazardType: parsed.data.hazardType ?? null },
    });
  } catch (error) {
    if (isUniqueViolation(error, "name")) return DUPLICATE_NAME;
    console.error("updateTemplate failed", error);
    return { success: false, error: "Couldn't save the template. Try again." };
  }

  revalidatePath("/templates", "layout");
  return { success: true, data: undefined };
}

/** Creates a copy of the template named by {@link copyName}. Throws a unique violation when the name was taken meanwhile. */
async function createCopy(id: string): Promise<string | null> {
  const [template, names] = await Promise.all([
    prisma.messageTemplate.findUnique({ where: { id }, select: { name: true, hazardType: true, body: true } }),
    prisma.messageTemplate.findMany({ select: { name: true } }),
  ]);
  if (!template) return null;

  const copy = await prisma.messageTemplate.create({
    data: {
      ...template,
      name: copyName(template.name, names.map((row) => row.name)),
    },
    select: { id: true },
  });
  return copy.id;
}

/**
 * Copies a template's hazard and body under the next free `<name> (copy)` name.
 * The officer stays on the list, so this returns the new id instead of redirecting.
 */
export async function duplicateTemplate(id: string): Promise<ActionResult<{ id: string }>> {
  await requireOfficer();

  try {
    let copyId: string | null;
    try {
      copyId = await createCopy(id);
    } catch (error) {
      // Another copy took the name between reading the names and creating; try once with a fresh list.
      if (!isUniqueViolation(error, "name")) throw error;
      copyId = await createCopy(id);
    }
    if (!copyId) return { success: false, error: "This template no longer exists." };

    revalidatePath("/templates", "layout");
    return { success: true, data: { id: copyId } };
  } catch (error) {
    if (isUniqueViolation(error, "name")) return { success: false, error: NAME_TAKEN };
    console.error("duplicateTemplate failed", error);
    return { success: false, error: "Couldn't duplicate the template. Try again." };
  }
}

/** Deletes a template, then redirects to `/templates`. Past broadcasts keep their own copy of the text. */
export async function deleteTemplate(id: string): Promise<ActionResult> {
  await requireOfficer();

  try {
    await prisma.messageTemplate.delete({ where: { id } });
  } catch (error) {
    console.error("deleteTemplate failed", error);
    return { success: false, error: "Couldn't delete the template. Try again." };
  }

  revalidatePath("/templates", "layout");
  redirect("/templates");
}
