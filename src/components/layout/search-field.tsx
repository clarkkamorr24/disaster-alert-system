"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { useEffect, useRef, type ChangeEvent } from "react";

/** How long typing must pause before the search runs. */
const SEARCH_DEBOUNCE_MS = 500;

interface SearchFieldProps {
  /** The page the search submits to, such as `/alerts`. */
  action: string;
  /** Names the search box for screen readers. */
  label: string;
  placeholder: string;
  defaultValue: string;
  /** Other params to keep, such as the tab and filters. Empty values are left out. */
  keep?: Record<string, string | null>;
}

/**
 * A search box that submits as a GET form (`?q=`) 500ms after typing stops (or
 * at once on Enter), keeping the given params and going back to page 1.
 */
export function SearchField({ action, label, placeholder, defaultValue, keep = {} }: SearchFieldProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // A link such as Clear filters changes the query without typing; don't fight the officer mid-typing.
  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement !== input) input.value = defaultValue;
  }, [defaultValue]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (value.trim() !== defaultValue) formRef.current?.requestSubmit();
    }, SEARCH_DEBOUNCE_MS);
  }

  return (
    <Form
      ref={formRef}
      action={action}
      replace
      scroll={false}
      onSubmit={() => clearTimeout(timer.current)}
      role="search"
      className="flex min-w-[200px] flex-[0_1_330px]"
    >
      {Object.entries(keep).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <label className="flex min-h-[39px] flex-1 items-center gap-[9px] rounded-lg border border-input bg-table-head px-[11px] text-[#8b978f] focus-within:border-primary focus-within:ring-3 focus-within:ring-ring/25 dark:text-muted-foreground">
        <Search className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span className="sr-only">{label}</span>
        <input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={defaultValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="h-10 min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-[#8b978f] dark:placeholder:text-muted-foreground"
        />
      </label>
    </Form>
  );
}
