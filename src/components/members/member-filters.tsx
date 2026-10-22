"use client";

import { Search } from "lucide-react";
import Form from "next/form";

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
import type { MemberListFilters, ZoneOption } from "@/types/member";

const STATUS_ITEMS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
];

interface MemberFiltersProps {
  filters: MemberListFilters;
  zones: ZoneOption[];
}

/** Search, zone, and status filters. Submitting navigates to `/members` with them in the URL, back on page 1. */
export function MemberFilters({ filters, zones }: MemberFiltersProps) {
  const zoneItems = [
    { value: null, label: "All zones" },
    ...zones.map((zone) => ({ value: zone.id, label: zone.name })),
  ];

  return (
    <Form
      action="/members"
      className="grid gap-3 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_12rem_9rem_auto] md:items-end"
    >
      <div className="flex flex-col gap-2 sm:col-span-2 md:col-span-1">
        <Label htmlFor="member-search">Search</Label>
        <Input
          id="member-search"
          name="q"
          type="search"
          placeholder="Name or phone number"
          defaultValue={filters.q}
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="member-zone-filter">Zone</Label>
        <Select name="zone" items={zoneItems} defaultValue={filters.zoneId ?? null}>
          <SelectTrigger id="member-zone-filter" className="h-11 w-full text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {zoneItems.map((item) => (
              <SelectItem key={item.value ?? "all"} value={item.value} className="min-h-11 text-base">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="member-status-filter">Status</Label>
        <Select name="status" items={STATUS_ITEMS} defaultValue={filters.status}>
          <SelectTrigger id="member-status-filter" className="h-11 w-full text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value} className="min-h-11 text-base">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" variant="outline" className="h-11 px-4 text-base sm:col-span-2 md:col-span-1">
        <Search data-icon="inline-start" />
        Search
      </Button>
    </Form>
  );
}
