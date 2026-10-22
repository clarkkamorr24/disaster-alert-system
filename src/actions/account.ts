"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { signIn } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import { requireOfficer } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { accountProfileSchema, changePasswordSchema } from "@/lib/validation/account";
import type { ActionResult } from "@/types/action-result";

const INVALID_FIELDS = "Check the highlighted fields.";

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const officer = await requireOfficer();

  const parsed = accountProfileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: INVALID_FIELDS,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await prisma.officer.update({ where: { id: officer.id }, data: parsed.data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        error: INVALID_FIELDS,
        fieldErrors: { email: ["That email is already in use."] },
      };
    }
    console.error("updateProfile failed", error);
    return { success: false, error: "Couldn't save your profile. Try again." };
  }

  revalidatePath("/settings");
  return { success: true, data: undefined };
}

export async function changePassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const officer = await requireOfficer();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: INVALID_FIELDS,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { currentPassword, newPassword } = parsed.data;

  try {
    const { passwordHash } = await prisma.officer.findUniqueOrThrow({
      where: { id: officer.id },
      select: { passwordHash: true },
    });
    if (!(await verifyPassword(currentPassword, passwordHash))) {
      return {
        success: false,
        error: INVALID_FIELDS,
        fieldErrors: { currentPassword: ["Current password is incorrect."] },
      };
    }

    // Bumping the version makes every token issued before this change stale.
    await prisma.officer.update({
      where: { id: officer.id },
      data: { passwordHash: await hashPassword(newPassword), sessionVersion: { increment: 1 } },
    });
  } catch (error) {
    console.error("changePassword failed", error);
    return { success: false, error: "Couldn't change your password. Try again." };
  }

  // Re-issue this device's token with the new version, so only the other devices are signed out.
  try {
    await signIn("credentials", {
      email: officer.email,
      password: newPassword,
      redirectTo: "/settings?passwordChanged=1",
    });
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Password changed, but this device was signed out. Sign in with the new password.",
      };
    }
    // signIn redirects by throwing; let Next.js handle it.
    throw error;
  }
}
