"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { alertInputSchema } from "@/lib/validation/alert";
import type { ActionResult } from "@/types/action-result";

function revalidateAlertPages() {
  revalidatePath("/alerts", "layout");
  revalidatePath("/dashboard");
}

/** Logs a new active alert from the alert form, then redirects to its detail page. */
export async function createAlert(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOfficer();

  const parsed = alertInputSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    hazardType: formData.get("hazardType") || undefined,
    severity: formData.get("severity") || undefined,
    officialLevel: String(formData.get("officialLevel") ?? ""),
    description: String(formData.get("description") ?? ""),
    zoneIds: formData.getAll("zoneIds").map(String),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { zoneIds, ...data } = parsed.data;
  let id: string;
  try {
    const alert = await prisma.hazardAlert.create({
      data: { ...data, zones: { connect: zoneIds.map((zoneId) => ({ id: zoneId })) } },
      select: { id: true },
    });
    id = alert.id;
  } catch (error) {
    // A zone deleted while the form was open fails the connect.
    console.error("createAlert failed", error);
    return { success: false, error: "Couldn't log the alert. Reload the page and try again." };
  }

  revalidateAlertPages();
  redirect(`/alerts/${id}`);
}

/** Marks an active alert resolved. An alert that is already resolved is left as is. */
export async function resolveAlert(id: string): Promise<ActionResult> {
  await requireOfficer();

  try {
    await prisma.hazardAlert.updateMany({
      where: { id, status: "ACTIVE" },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  } catch (error) {
    console.error("resolveAlert failed", error);
    return { success: false, error: "Couldn't resolve the alert. Try again." };
  }

  revalidateAlertPages();
  return { success: true, data: undefined };
}
