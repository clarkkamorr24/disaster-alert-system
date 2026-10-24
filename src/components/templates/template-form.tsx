"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { cn } from "cn";

import { createTemplate, updateTemplate } from "@/actions/templates";
import { ANY_HAZARD, HazardSelect, PlaceholderChips, type HazardChoice } from "@/components/templates/template-fields";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { estimateCredits, SMS_MAX_CHARS, withPrefix } from "@/lib/domain/sms-text";
import { isRedirectError } from "@/lib/redirect-error";
import type { ActionResult } from "@/types/action-result";
import type { TemplateFormValues } from "@/types/template";

interface TemplateFormProps {
  /** The SMS prefix every message starts with, such as `Mi-isi FA:`. */
  prefix: string;
  /** The template to edit; omit to create a new one. */
  template?: TemplateFormValues;
}

interface FieldErrorProps {
  id: string;
  message: string | undefined;
}

function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

/** Input props that link a field to its error message. */
function errorProps(id: string, message: string | undefined) {
  return message ? { "aria-invalid": true, "aria-describedby": id } : {};
}

/** The template form card with the sticky sample preview beside it (stacked on narrow screens). */
export function TemplateForm({ prefix, template }: TemplateFormProps) {
  async function submit(prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
    let result: ActionResult;
    try {
      result = template
        ? await updateTemplate(template.id, prev, formData)
        : await createTemplate(prev, formData);
    } catch (error) {
      // A successful create redirects to /templates; let Next.js finish the navigation.
      if (isRedirectError(error)) toast.success("Template added.");
      throw error;
    }
    if (result.success) toast.success("Template saved.");
    else toast.error(result.error);
    return result;
  }

  const [state, formAction, pending] = useActionState(submit, null);
  const [hazard, setHazard] = useState<HazardChoice>(template?.hazardType ?? ANY_HAZARD);
  const [body, setBody] = useState(template?.body ?? "");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const error = (field: string) => fieldErrors?.[field]?.[0];

  const message = withPrefix(body.trim(), prefix);
  const credits = estimateCredits(message);
  const tooLong = message.length > SMS_MAX_CHARS;

  function insertPlaceholder(name: string) {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const token = `{${name}}`;
    const { selectionStart, selectionEnd, value } = textarea;
    setBody(value.slice(0, selectionStart) + token + value.slice(selectionEnd));
    const caret = selectionStart + token.length;
    // Wait for React to write the new value before placing the caret after the token.
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  }

  // Submitting through onSubmit skips React's automatic form reset, so every
  // field keeps what was entered after a rejected save. The hazard lives in
  // state and is added to the form data here.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("hazardType", hazard === ANY_HAZARD ? "" : hazard);
    startTransition(() => formAction(formData));
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <form
        method="post"
        onSubmit={handleSubmit}
        noValidate
        className="flex min-w-0 flex-[3_1_440px] flex-col gap-6 rounded-xl border bg-card p-[22px]"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="template-name" className="text-sm font-semibold">
            Name
          </Label>
          <Input
            id="template-name"
            name="name"
            required
            maxLength={60}
            autoComplete="off"
            placeholder="Lahar warning"
            defaultValue={template?.name}
            {...errorProps("template-name-error", error("name"))}
            className="h-[42px] text-sm"
          />
          <FieldError id="template-name-error" message={error("name")} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="template-hazard" className="text-sm font-semibold">
            Hazard type
          </Label>
          <HazardSelect
            id="template-hazard"
            value={hazard}
            onChange={setHazard}
            errorProps={errorProps("template-hazard-error", error("hazardType"))}
          />
          <FieldError id="template-hazard-error" message={error("hazardType")} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="template-body" className="text-sm font-semibold">
            Message
          </Label>
          <PlaceholderChips onInsert={insertPlaceholder} />
          <Textarea
            ref={bodyRef}
            id="template-body"
            name="body"
            required
            rows={6}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            aria-invalid={error("body") ? true : undefined}
            aria-describedby={error("body") ? "template-body-count template-body-error" : "template-body-count"}
            className="text-sm leading-normal"
          />
          <p
            id="template-body-count"
            className={cn("text-xs tabular-nums", tooLong ? "text-destructive" : "text-muted-foreground")}
          >
            {message.length} / {SMS_MAX_CHARS} characters · {credits} {credits === 1 ? "credit" : "credits"} per
            member
          </p>
          <FieldError id="template-body-error" message={error("body")} />
          <p className="text-xs text-muted-foreground">
            The count includes the &ldquo;{prefix}&rdquo; prefix and counts placeholders as written. The final count
            is shown when you send.
          </p>
        </div>

        <Button type="submit" disabled={pending} className="h-11 self-start px-5 text-[13px]">
          {pending ? "Saving…" : template ? "Save template" : "Add template"}
        </Button>
      </form>

      <TemplatePreview body={body} prefix={prefix} />
    </div>
  );
}
