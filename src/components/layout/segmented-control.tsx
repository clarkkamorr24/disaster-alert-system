"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "cn";

const TRACK_CLASS = "inline-flex flex-wrap gap-0.5 self-start rounded-[9px] bg-[#eef2ef] p-[3px] dark:bg-muted";
const SEGMENT_CLASS =
  "inline-flex min-h-11 items-center rounded-[7px] px-3.5 text-xs font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 sm:min-h-8";
const CHOSEN_CLASS = "bg-card text-foreground shadow-[0_1px_2px_rgb(23_35_28/.1)]";

/** One choice of a {@link SegmentedControl}. */
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Shown before the label, such as a colored icon. */
  leading?: ReactNode;
  /** Classes for this segment, such as its own `data-checked:` colors. */
  className?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  /** `null` when nothing is chosen yet. */
  value: T | null;
  onChange: (value: T) => void;
  /** The id of the element that labels the control. */
  labelledBy: string;
  /** The id of the field's error message, when there is one. */
  errorId?: string;
  disabled?: boolean;
}

/**
 * A gray track of segments with the chosen one in white. It is a radio group:
 * arrow keys move between segments.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
  errorId,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      aria-describedby={errorId}
      aria-invalid={errorId ? true : undefined}
      value={value}
      onValueChange={(next) => onChange(next as T)}
      disabled={disabled}
      className={cn(TRACK_CLASS, "cursor-pointer aria-invalid:ring-2 aria-invalid:ring-destructive/40")}
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className={cn(
            SEGMENT_CLASS,
            "gap-1.5 data-disabled:cursor-not-allowed data-disabled:opacity-60 data-checked:bg-card data-checked:text-foreground data-checked:shadow-[0_1px_2px_rgb(23_35_28/.1)]",
            option.className,
          )}
        >
          {option.leading}
          {option.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}

/** One link of {@link SegmentedLinks}. */
export interface SegmentedLink {
  href: string;
  label: string;
  /** Shown after the label, such as how many rows the view has. */
  count?: number;
  current: boolean;
}

/**
 * The segmented look as navigation links, for views kept in the URL. The
 * current one is white and has `aria-current="page"`.
 */
export function SegmentedLinks({ label, links }: { label: string; links: SegmentedLink[] }) {
  return (
    <nav aria-label={label} className={TRACK_CLASS}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          scroll={false}
          aria-current={link.current ? "page" : undefined}
          className={cn(SEGMENT_CLASS, "gap-1.5", link.current && CHOSEN_CLASS)}
        >
          {link.label}
          {link.count !== undefined && <span className="tabular-nums opacity-70">{link.count.toLocaleString("en-US")}</span>}
        </Link>
      ))}
    </nav>
  );
}
