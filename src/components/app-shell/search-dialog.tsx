"use client";

import {
  CircleUserRound,
  MessageSquareText,
  Plus,
  Search,
  Send,
  TriangleAlert,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { searchEverything } from "@/actions/search";
import { NAV_ITEMS, SETTINGS_ITEM } from "@/components/app-shell/nav-items";
import { SeverityDot } from "@/components/alerts/severity-dot";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatManilaDateTime } from "@/lib/datetime";
import { SEVERITIES } from "@/lib/domain/hazards";
import { isCriticalActive } from "@/lib/domain/status-tone";
import { SEARCH_MIN_LENGTH } from "@/lib/validation/search";
import type { Severity } from "@/generated/prisma/enums";
import type { SearchResults } from "@/types/search";

const DEBOUNCE_MS = 250;
const UNAVAILABLE_MESSAGE = "Search is unavailable. Try again.";

interface PageShortcut {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Extra words that find the page, such as "purok" for Zones. */
  keywords: string;
}

const KEYWORDS: Record<string, string> = {
  "/dashboard": "home overview map",
  "/alerts": "hazards warnings",
  "/zones": "farm purok sitio map",
  "/members": "farmers phone",
  "/broadcasts": "sms messages delivery",
  "/templates": "messages sms",
  "/settings": "account password sms credits",
};

const PAGE_SHORTCUTS: PageShortcut[] = [
  ...[...NAV_ITEMS, SETTINGS_ITEM].map((item) => ({ ...item, keywords: KEYWORDS[item.href] ?? "" })),
  { label: "New alert", href: "/alerts/new", icon: Plus, keywords: "log hazard" },
  { label: "Import members", href: "/members/import", icon: Upload, keywords: "csv farmers" },
  { label: "New broadcast", href: "/broadcasts/new", icon: Send, keywords: "sms announcement" },
];

interface Option {
  key: string;
  href: string;
  title: string;
  detail?: string;
  icon: LucideIcon;
  severity?: Severity;
  pulse?: boolean;
}

interface Group {
  label: string;
  options: Option[];
}

function matchPages(query: string): Option[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return PAGE_SHORTCUTS.filter((page) => {
    const text = `${page.label} ${page.keywords}`.toLowerCase();
    return words.every((word) => text.includes(word));
  }).map((page) => ({ key: `page:${page.href}`, href: page.href, title: page.label, icon: page.icon }));
}

function toGroups(query: string, results: SearchResults | null): Group[] {
  const groups: Group[] = [{ label: "Pages", options: matchPages(query) }];
  if (results) {
    groups.push(
      {
        label: "Members",
        options: results.members.map((member) => ({
          key: `member:${member.id}`,
          href: `/members/${member.id}`,
          title: member.name,
          detail: `${member.phone} · ${member.zoneName}${member.isActive ? "" : " · Inactive"}`,
          icon: CircleUserRound,
        })),
      },
      {
        label: "Alerts",
        options: results.alerts.map((alert) => ({
          key: `alert:${alert.id}`,
          href: `/alerts/${alert.id}`,
          title: alert.title,
          detail: `${SEVERITIES[alert.severity].label} · ${alert.status === "ACTIVE" ? "Active" : "Resolved"}`,
          icon: TriangleAlert,
          severity: alert.severity,
          pulse: isCriticalActive(alert.severity, alert.status),
        })),
      },
      {
        label: "Broadcasts",
        options: results.broadcasts.map((broadcast) => ({
          key: `broadcast:${broadcast.id}`,
          href: `/broadcasts/${broadcast.id}`,
          title: broadcast.title,
          detail: `Sent ${formatManilaDateTime(broadcast.createdAt)}`,
          icon: MessageSquareText,
        })),
      },
    );
  }
  return groups.filter((group) => group.options.length > 0);
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Search across pages, members, alerts, and broadcasts. Its state resets each time it opens. */
export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] max-h-[76vh] -translate-y-0 grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <SearchPanel onSelect={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SearchPanel({ onSelect }: { onSelect: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  // Kept with the query they answer, so results for an older query are never shown or opened.
  const [answered, setAnswered] = useState<{ query: string; results: SearchResults } | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Only the newest request may update the results, so a slow reply can't overwrite a newer one.
  const latestRequest = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const trimmed = query.trim();
  const groups = toGroups(trimmed, answered?.query === trimmed ? answered.results : null);
  const options = groups.flatMap((group) => group.options);
  const current = Math.min(activeIndex, options.length - 1);
  const optionId = (index: number) => `search-option-${index}`;

  useEffect(() => {
    if (current >= 0) document.getElementById(optionId(current))?.scrollIntoView({ block: "nearest" });
  }, [current]);

  function handleChange(value: string) {
    setQuery(value);
    setActiveIndex(0);
    clearTimeout(timer.current);
    const request = ++latestRequest.current;

    if (value.trim().length < SEARCH_MIN_LENGTH) {
      setSearching(false);
      setError(null);
      return;
    }

    setSearching(true);
    timer.current = setTimeout(async () => {
      const result = await searchEverything(value).catch(() => null);
      if (request !== latestRequest.current) return;
      setSearching(false);
      setAnswered(result?.success ? { query: value.trim(), results: result.data } : null);
      setError(result?.success ? null : (result?.error ?? UNAVAILABLE_MESSAGE));
    }, DEBOUNCE_MS);
  }

  function choose(option: Option) {
    router.push(option.href);
    onSelect();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (options.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current - 1 + options.length) % options.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(options[current]);
    }
  }

  // Where each group starts in `options`, for the option ids and keyboard index.
  const starts = groups.map((_, i) =>
    groups.slice(0, i).reduce((count, group) => count + group.options.length, 0),
  );

  return (
    <>
      <div className="flex items-center gap-2.5 border-b px-4">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={1.75} />
        <input
          type="text"
          role="combobox"
          aria-label="Search members, alerts, broadcasts, and pages"
          aria-expanded={options.length > 0}
          aria-controls="search-results"
          aria-activedescendant={current >= 0 ? optionId(current) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search members, alerts, broadcasts…"
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        <kbd className="hidden rounded-[5px] border px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground sm:block">
          Esc
        </kbd>
      </div>

      <div className="min-h-0 overflow-y-auto p-2">
        <ul id="search-results" role="listbox" aria-label="Search results" className="flex flex-col gap-2">
          {groups.map((group, groupIndex) => (
            <li key={group.label} role="presentation">
              <p
                id={`search-group-${group.label}`}
                className="px-2.5 pt-1 pb-1.5 text-[10px] font-bold tracking-[.08em] text-muted-foreground uppercase"
              >
                {group.label}
              </p>
              <ul role="group" aria-labelledby={`search-group-${group.label}`}>
                {group.options.map((option, i) => {
                  const optionIndex = starts[groupIndex] + i;
                  const Icon = option.icon;
                  const active = optionIndex === current;
                  return (
                    <li
                      key={option.key}
                      id={optionId(optionIndex)}
                      role="option"
                      aria-selected={active}
                      onMouseMove={() => setActiveIndex(optionIndex)}
                      onClick={() => choose(option)}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4" aria-hidden="true" strokeWidth={1.75} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{option.title}</span>
                        {option.detail && (
                          <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                            {option.severity && <SeverityDot severity={option.severity} pulse={option.pulse} />}
                            {option.detail}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" className="px-2.5 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {!error && searching && options.length === 0 && (
          <p className="px-2.5 py-3 text-sm text-muted-foreground">Searching…</p>
        )}
        {!error && !searching && options.length === 0 && (
          <p className="px-2.5 py-3 text-sm text-muted-foreground">
            No matches for &ldquo;{trimmed}&rdquo;.
          </p>
        )}
      </div>
    </>
  );
}
