"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { makeTemplateSchema, type TemplateInput } from "@/lib/validation/template";
import type { ActionResult } from "@/types/action-result";

const INVALID_FIELDS = "Check the highlighted fields.";
const DUPLICATE_NAME: ActionResult = {
  success: false,
  error: INVALID_FIELDS,
  fieldErrors: { name: ["A template with this name already exists."] },
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
