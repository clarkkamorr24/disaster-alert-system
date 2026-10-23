"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createAlert } from "@/actions/alerts";
import { SeverityPicker } from "@/components/alerts/severity-picker";
import { ZonePicker } from "@/components/alerts/zone-picker";
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
import { HazardType, type Severity } from "@/generated/prisma/enums";
import { HAZARD_TYPES } from "@/lib/domain/hazards";
import { isRedirectError } from "@/lib/redirect-error";
import type { ActionResult } from "@/types/action-result";
import type { ZoneOption } from "@/types/member";

interface AlertFormProps {
  /** Zones to choose from; at least one. */
  zones: ZoneOption[];
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

const hazardItems = Object.values(HazardType).map((type) => ({
  value: type,
  label: HAZARD_TYPES[type].label,
}));

async function submit(prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  let result: ActionResult;
  try {
    result = await createAlert(prev, formData);
  } catch (error) {
    // A successful create redirects to the alert; let Next.js finish the navigation.
    if (isRedirectError(error)) toast.success("Alert logged.");
    throw error;
  }
  if (!result.success) toast.error(result.error);
  return result;
}

export function AlertForm({ zones }: AlertFormProps) {
  const [state, formAction, pending] = useActionState(submit, null);
  const [hazardType, setHazardType] = useState<HazardType | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [zoneIds, setZoneIds] = useState<string[]>([]);

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const error = (field: string) => fieldErrors?.[field]?.[0];
  const suggestions = hazardType ? HAZARD_TYPES[hazardType].levelSuggestions : [];

  // Submitting through onSubmit skips React's automatic form reset, so every
  // field keeps what was entered after a rejected save. The hazard, severity,
  // and zones live in state and are added to the form data here.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("hazardType", hazardType ?? "");
    formData.set("severity", severity ?? "");
    for (const zoneId of zoneIds) formData.append("zoneIds", zoneId);
    startTransition(() => formAction(formData));
  }

  return (
    <form method="post" onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="alert-title">Title</Label>
        <Input
          id="alert-title"
          name="title"
          required
          maxLength={120}
          autoComplete="off"
          placeholder="Mayon Volcano raised to Alert Level 3"
          {...errorProps("alert-title-error", error("title"))}
          className="h-11"
        />
        <FieldError id="alert-title-error" message={error("title")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="alert-hazard">Hazard type</Label>
        <Select
          items={hazardItems}
          value={hazardType}
          onValueChange={(value) => setHazardType(value as HazardType | null)}
        >
          <SelectTrigger
            id="alert-hazard"
            {...errorProps("alert-hazard-error", error("hazardType"))}
            className="w-full text-base data-[size=default]:h-11"
          >
            <SelectValue placeholder="Choose a hazard" />
          </SelectTrigger>
          <SelectContent>
            {hazardItems.map((item) => {
              const { icon: Icon, color } = HAZARD_TYPES[item.value];
              return (
                <SelectItem key={item.value} value={item.value} className="min-h-11 text-base">
                  <Icon className="size-4" color={color} strokeWidth={2.5} aria-hidden="true" />
                  {item.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <FieldError id="alert-hazard-error" message={error("hazardType")} />
      </div>

      <div className="flex flex-col gap-2">
        <span id="alert-severity-label" className="text-sm leading-none font-medium">
          Severity
        </span>
        <SeverityPicker
          value={severity}
          onChange={setSeverity}
          errorId={error("severity") ? "alert-severity-error" : undefined}
        />
        <FieldError id="alert-severity-error" message={error("severity")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="alert-level">Official level (optional)</Label>
        <Input
          id="alert-level"
          name="officialLevel"
          list="alert-level-suggestions"
          maxLength={60}
          autoComplete="off"
          placeholder={
            suggestions.length > 0
              ? `e.g. ${suggestions[Math.floor(suggestions.length / 2)]}`
              : "As written in the PHIVOLCS or PAGASA bulletin"
          }
          {...errorProps("alert-level-error", error("officialLevel"))}
          className="h-11"
        />
        <datalist id="alert-level-suggestions">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
        <FieldError id="alert-level-error" message={error("officialLevel")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="alert-description">Description (optional)</Label>
        <Textarea
          id="alert-description"
          name="description"
          maxLength={2000}
          rows={4}
          {...errorProps("alert-description-error", error("description"))}
        />
        <FieldError id="alert-description-error" message={error("description")} />
      </div>

      <div className="flex flex-col gap-2">
        <span id="alert-zones-label" className="text-sm leading-none font-medium">
          Affected zones
        </span>
        <ZonePicker
          zones={zones}
          selected={zoneIds}
          onChange={setZoneIds}
          errorId={error("zoneIds") ? "alert-zones-error" : undefined}
        />
        <FieldError id="alert-zones-error" message={error("zoneIds")} />
      </div>

      <Button type="submit" disabled={pending} className="h-11 self-start px-5 text-base">
        {pending ? "Logging…" : "Log alert"}
      </Button>
    </form>
  );
}
