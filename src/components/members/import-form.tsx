"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { importMembers, previewMemberImport } from "@/actions/member-import";
import { ImportPreview } from "@/components/members/import-preview";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FILE_TOO_LARGE_MESSAGE, MAX_IMPORT_BYTES } from "@/lib/members/import-file";
import type { ActionResult } from "@/types/action-result";
import type { MemberImportPreview } from "@/types/member";

type PreviewResult = ActionResult<MemberImportPreview>;
type ImportResult = ActionResult<{ imported: number }>;

function membersLabel(count: number): string {
  return `${count} member${count === 1 ? "" : "s"}`;
}

/**
 * Two-step member CSV import: check a file to see which rows are ready, then
 * confirm consent and import them. Choosing another file hides the old check.
 */
export function ImportForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [checkedFile, setCheckedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [consent, setConsent] = useState(false);

  async function check(prev: PreviewResult | null, formData: FormData): Promise<PreviewResult> {
    const result = await previewMemberImport(prev, formData);
    if (!result.success) setFileError(result.error);
    return result;
  }

  async function runImport(prev: ImportResult | null, formData: FormData): Promise<ImportResult> {
    const result = await importMembers(prev, formData);
    if (result.success) {
      toast.success(`Imported ${membersLabel(result.data.imported)}.`);
      router.push("/members");
    } else {
      toast.error(result.error);
    }
    return result;
  }

  const [preview, checkAction, checking] = useActionState(check, null);
  const [, importAction, importing] = useActionState(runImport, null);
  const shownPreview =
    preview?.success && checkedFile === file && !checking ? preview.data : undefined;

  function handleCheck() {
    if (!file || !formRef.current) {
      setFileError("Choose a CSV file.");
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setFileError(FILE_TOO_LARGE_MESSAGE);
      return;
    }
    setFileError(undefined);
    setCheckedFile(file);
    setConsent(false);
    const formData = new FormData(formRef.current);
    startTransition(() => checkAction(formData));
  }

  // Submitting through onSubmit sends the same file again; the server checks
  // it again instead of trusting the preview.
  function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => importAction(formData));
  }

  return (
    <form ref={formRef} method="post" onSubmit={handleImport} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="import-file">CSV file</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="import-file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              setFile(event.currentTarget.files?.[0] ?? null);
              setFileError(undefined);
            }}
            {...(fileError ? { "aria-invalid": true, "aria-describedby": "import-file-error" } : {})}
            className="h-11 py-2"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleCheck}
            disabled={checking || importing}
            className="h-11 shrink-0 px-5 text-base"
          >
            {checking ? "Checking…" : "Check file"}
          </Button>
        </div>
        {fileError && (
          <p id="import-file-error" className="text-sm text-destructive">
            {fileError}
          </p>
        )}
      </div>

      {shownPreview && (
        <>
          <ImportPreview {...shownPreview} />

          {shownPreview.validCount > 0 && (
            <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
              <Checkbox
                name="consentConfirmed"
                checked={consent}
                onCheckedChange={setConsent}
                className="mt-0.5 size-5"
              />
              <span className="text-sm">
                Consent forms were collected for every member in this file.
              </span>
            </label>
          )}

          <Button
            type="submit"
            disabled={shownPreview.validCount === 0 || !consent || importing}
            className="h-11 self-start px-5 text-base"
          >
            {importing ? "Importing…" : `Import ${membersLabel(shownPreview.validCount)}`}
          </Button>
        </>
      )}
    </form>
  );
}
