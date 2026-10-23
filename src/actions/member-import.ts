"use server";

import { revalidatePath } from "next/cache";

import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { decodeCsvBytes, parseMemberCsv, type MemberCsvResult } from "@/lib/members/csv-import";
import { FILE_TOO_LARGE_MESSAGE, MAX_IMPORT_BYTES } from "@/lib/members/import-file";
import { isUniqueViolation } from "@/lib/prisma-errors";
import type { ActionResult } from "@/types/action-result";
import type { MemberImportPreview } from "@/types/member";

type Checked = { success: true; data: MemberCsvResult } | { success: false; error: string };

/** Reads the uploaded `file` and checks it against the zones and registered numbers. */
async function checkUpload(formData: FormData): Promise<Checked> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose a CSV file." };
  }
  if (file.size > MAX_IMPORT_BYTES) return { success: false, error: FILE_TOO_LARGE_MESSAGE };

  const [bytes, zones, members] = await Promise.all([
    file.arrayBuffer(),
    prisma.farmZone.findMany({ select: { id: true, name: true } }),
    prisma.member.findMany({ select: { phone: true } }),
  ]);
  return {
    success: true,
    data: parseMemberCsv(decodeCsvBytes(bytes), {
      zoneIdByName: new Map(zones.map((zone) => [zone.name, zone.id])),
      existingPhones: new Set(members.map((member) => member.phone)),
    }),
  };
}

/** Checks an uploaded member CSV and reports how many rows are ready and why the rest fail. */
export async function previewMemberImport(
  _prev: ActionResult<MemberImportPreview> | null,
  formData: FormData,
): Promise<ActionResult<MemberImportPreview>> {
  await requireOfficer();

  try {
    const checked = await checkUpload(formData);
    if (!checked.success) return checked;
    const { valid, errors } = checked.data;
    return { success: true, data: { validCount: valid.length, errors } };
  } catch (error) {
    console.error("previewMemberImport failed", error);
    return { success: false, error: "Couldn't check the file. Try again." };
  }
}

/**
 * Adds every valid row of an uploaded member CSV in one transaction, recording
 * consent now. The file is checked again here; the preview is never trusted.
 * Requires `consentConfirmed` to be checked.
 */
export async function importMembers(
  _prev: ActionResult<{ imported: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ imported: number }>> {
  await requireOfficer();

  if (formData.get("consentConfirmed") !== "on") {
    return { success: false, error: "Confirm that consent forms were collected." };
  }

  try {
    const checked = await checkUpload(formData);
    if (!checked.success) return checked;
    const { valid } = checked.data;
    if (valid.length === 0) return { success: false, error: "No rows are ready to import." };

    const consentAt = new Date();
    const [{ count }] = await prisma.$transaction([
      prisma.member.createMany({
        data: valid.map(({ firstName, lastName, phone, zoneId, crops }) => ({
          firstName,
          lastName,
          phone,
          zoneId,
          crops,
          consentAt,
        })),
      }),
    ]);

    revalidatePath("/members", "layout");
    return { success: true, data: { imported: count } };
  } catch (error) {
    if (isUniqueViolation(error, "phone")) {
      return {
        success: false,
        error: "Some numbers were registered in the meantime. Check the file again.",
      };
    }
    console.error("importMembers failed", error);
    return { success: false, error: "Couldn't import the members. Nothing was added. Try again." };
  }
}
