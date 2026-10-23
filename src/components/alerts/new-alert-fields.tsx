"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** A form section: a 14px semibold label, optional actions on its right, then the control. */
export function FieldSection({
  labelId,
  label,
  aside,
  error,
  errorId,
  children,
}: {
  labelId: string;
  label: string;
  aside?: ReactNode;
  error?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span id={labelId} className="text-sm font-semibold">
          {label}
        </span>
        {aside}
      </div>
      {children}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helper?: ReactNode;
  /** Left out for the SMS, so a paste isn't cut and the length error shows instead. */
  maxLength?: number;
  placeholder?: string;
  /** A `<datalist>` id with suggestions. */
  list?: string;
  /** Rows for a textarea; without it the field is a single-line input. */
  rows?: number;
  disabled?: boolean;
}

/** A labeled input or textarea with its error and helper text underneath. */
export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  helper,
  maxLength,
  placeholder,
  list,
  rows,
  disabled,
}: TextFieldProps) {
  const describedBy = [error && `${id}-error`, helper && `${id}-helper`].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    value,
    maxLength,
    placeholder,
    disabled,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      {rows ? (
        <Textarea {...common} rows={rows} onChange={(event) => onChange(event.target.value)} className="text-sm leading-normal" />
      ) : (
        <Input
          {...common}
          list={list}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          className="h-[42px] text-sm"
        />
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
      {helper && (
        <p id={`${id}-helper`} className="text-xs text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  );
}

interface TitleLevelFieldsProps {
  title: string;
  onTitleChange: (value: string) => void;
  officialLevel: string;
  onOfficialLevelChange: (value: string) => void;
  /** The hazard's official levels, offered in a `<datalist>`. */
  suggestions: readonly string[];
  errors: { title?: string; officialLevel?: string };
  disabled?: boolean;
}

/** The Title and Official level inputs side by side, with level suggestions for the chosen hazard. */
export function TitleLevelFields({
  title,
  onTitleChange,
  officialLevel,
  onOfficialLevelChange,
  suggestions,
  errors,
  disabled,
}: TitleLevelFieldsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <TextField
        id="alert-title"
        label="Title"
        value={title}
        onChange={onTitleChange}
        error={errors.title}
        maxLength={120}
        disabled={disabled}
        placeholder="Mayon Volcano raised to Alert Level 3"
      />
      <TextField
        id="alert-officialLevel"
        label="Official level (optional)"
        value={officialLevel}
        onChange={onOfficialLevelChange}
        error={errors.officialLevel}
        maxLength={60}
        disabled={disabled}
        list="alert-level-suggestions"
        placeholder={
          suggestions.length > 0
            ? `e.g. ${suggestions[Math.floor(suggestions.length / 2)]}`
            : "As written in the PHIVOLCS or PAGASA bulletin"
        }
      />
      <datalist id="alert-level-suggestions">
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </div>
  );
}

/**
 * Shown once a send failed after the alert was logged: the alert's fields are
 * locked, so a retry sends the SMS about the alert as it was saved.
 */
export function LoggedAlertNote({ alertId }: { alertId: string }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-status-advisory-border bg-status-advisory-soft px-3.5 py-3 text-sm text-status-advisory"
    >
      The alert was logged, so its details are locked and only the SMS message can change. Fix the problem and press
      Send again, or{" "}
      <Link href={`/alerts/${alertId}`} className="font-semibold underline">
        open the alert
      </Link>
      .
    </p>
  );
}
