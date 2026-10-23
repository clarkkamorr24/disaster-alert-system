"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createTemplate, updateTemplate } from "@/actions/templates";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HazardType } from "@/generated/prisma/enums";
import { HAZARD_TYPES } from "@/lib/domain/hazards";
import { estimateCredits, SMS_MAX_CHARS, withPrefix } from "@/lib/domain/sms-text";
import { isRedirectError } from "@/lib/redirect-error";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/templates/render";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types/action-result";
import type { TemplateFormValues } from "@/types/template";

/** The select value for "Any hazard"; submitted as a blank hazard type. */
const ANY_HAZARD = "ANY";
type HazardChoice = HazardType | typeof ANY_HAZARD;

const hazardItems: { value: HazardChoice; label: string }[] = [
  { value: ANY_HAZARD, label: "Any hazard" },
  ...Object.values(HazardType).map((type) => ({ value: type, label: HAZARD_TYPES[type].label })),
];

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
    <form method="post" onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="template-name">Name</Label>
        <Input
          id="template-name"
          name="name"
          required
          maxLength={60}
          autoComplete="off"
          placeholder="Lahar warning"
          defaultValue={template?.name}
          {...errorProps("template-name-error", error("name"))}
          className="h-11"
        />
        <FieldError id="template-name-error" message={error("name")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="template-hazard">Hazard type</Label>
        <Select
          items={hazardItems}
          value={hazard}
          onValueChange={(value) => setHazard((value as HazardChoice | null) ?? ANY_HAZARD)}
        >
          <SelectTrigger
            id="template-hazard"
            {...errorProps("template-hazard-error", error("hazardType"))}
            className="w-full text-base data-[size=default]:h-11"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hazardItems.map((item) => {
              const config = item.value === ANY_HAZARD ? null : HAZARD_TYPES[item.value];
              return (
                <SelectItem key={item.value} value={item.value} className="min-h-11 text-base">
                  {config && (
                    <config.icon
                      className="size-4"
                      color={config.color}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  )}
                  {item.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <FieldError id="template-hazard-error" message={error("hazardType")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="template-body">Message</Label>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Insert a placeholder">
          <span className="text-sm text-muted-foreground">Insert:</span>
          {TEMPLATE_PLACEHOLDERS.map((name) => (
            <Button
              key={name}
              type="button"
              variant="outline"
              onClick={() => insertPlaceholder(name)}
              className="h-11 px-3 font-mono text-sm"
            >
              {`{${name}}`}
            </Button>
          ))}
        </div>
        <Textarea
          ref={bodyRef}
          id="template-body"
          name="body"
          required
          rows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          aria-invalid={error("body") ? true : undefined}
          aria-describedby={
            error("body") ? "template-body-count template-body-error" : "template-body-count"
          }
        />
        <p
          id="template-body-count"
          className={cn("text-sm tabular-nums", tooLong ? "text-destructive" : "text-muted-foreground")}
        >
          {message.length} / {SMS_MAX_CHARS} characters · {credits}{" "}
          {credits === 1 ? "credit" : "credits"} per member
        </p>
        <FieldError id="template-body-error" message={error("body")} />
        <p className="text-sm text-muted-foreground">
          The count includes the &ldquo;{prefix}&rdquo; prefix and counts placeholders as written.
          The final count is shown when you send.
        </p>
      </div>

      <TemplatePreview body={body} prefix={prefix} />

      <Button type="submit" disabled={pending} className="h-11 self-start px-5 text-base">
        {pending ? "Saving…" : template ? "Save template" : "Add template"}
      </Button>
    </form>
  );
}
