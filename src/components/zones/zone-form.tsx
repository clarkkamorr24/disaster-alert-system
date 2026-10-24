"use client";

import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import { createZone, updateZone } from "@/actions/zones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { isInMiIsi, OUTSIDE_MI_ISI_MESSAGE } from "@/lib/map";
import { isRedirectError } from "@/lib/redirect-error";
import type { ActionResult } from "@/types/action-result";
import type { ZoneFormValues } from "@/types/zone";

// Leaflet touches `window` on import, so the picker only loads in the browser.
const ZoneLocationPicker = dynamic(() => import("./zone-location-picker"), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] rounded-xl" />,
});

interface ZoneFormProps {
  /** The zone to edit; omit to create a new one. */
  zone?: ZoneFormValues;
}

interface FieldValues {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
}

interface ZoneFormState {
  result: ActionResult;
  /** Echoed back so a rejected entry survives React's form reset. */
  values: FieldValues;
}

function readValues(formData: FormData): FieldValues {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    latitude: String(formData.get("latitude") ?? ""),
    longitude: String(formData.get("longitude") ?? ""),
  };
}

/** The coordinates as a map point, or `null` unless both inputs hold a number. */
function toPoint(latitude: string, longitude: string): [number, number] | null {
  if (latitude.trim() === "" || longitude.trim() === "") return null;
  const point: [number, number] = [Number(latitude), Number(longitude)];
  return point.every(Number.isFinite) ? point : null;
}

function initialValues(zone: ZoneFormValues | undefined): FieldValues {
  return {
    name: zone?.name ?? "",
    description: zone?.description ?? "",
    latitude: zone ? String(zone.latitude) : "",
    longitude: zone ? String(zone.longitude) : "",
  };
}

export function ZoneForm({ zone }: ZoneFormProps) {
  async function submit(prev: ZoneFormState | null, formData: FormData): Promise<ZoneFormState> {
    let result: ActionResult;
    try {
      result = zone
        ? await updateZone(zone.id, prev?.result ?? null, formData)
        : await createZone(prev?.result ?? null, formData);
    } catch (error) {
      // A successful create redirects to /zones; let Next.js finish the navigation.
      if (isRedirectError(error)) toast.success("Zone added.");
      throw error;
    }
    if (result.success) toast.success("Zone saved.");
    else toast.error(result.error);
    return { result, values: readValues(formData) };
  }

  const [state, formAction, pending] = useActionState(submit, null);
  const failed = state && !state.result.success ? state : null;
  const fieldErrors = failed && !failed.result.success ? failed.result.fieldErrors : undefined;
  const values = failed?.values ?? initialValues(zone);
  // Controlled so Pick on map can fill them; React's form reset leaves controlled inputs alone.
  const [latitude, setLatitude] = useState(() => initialValues(zone).latitude);
  const [longitude, setLongitude] = useState(() => initialValues(zone).longitude);
  const [showPicker, setShowPicker] = useState(false);
  const [pickedOutside, setPickedOutside] = useState(false);

  function pick(lat: number, lng: number) {
    // A tap outside the barangay places nothing; the save would be rejected anyway.
    const inside = isInMiIsi(lat, lng);
    setPickedOutside(!inside);
    if (!inside) return;
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
  }

  const nameError = fieldErrors?.name?.[0];
  const descriptionError = fieldErrors?.description?.[0];
  const latitudeError = fieldErrors?.latitude?.[0];
  const longitudeError = fieldErrors?.longitude?.[0];

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="zone-name">Name</Label>
        <Input
          id="zone-name"
          name="name"
          required
          maxLength={60}
          placeholder="Purok 1"
          defaultValue={values.name}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "zone-name-error" : undefined}
          className="h-11"
        />
        {nameError && (
          <p id="zone-name-error" className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="zone-description">Description (optional)</Label>
        <Textarea
          id="zone-description"
          name="description"
          maxLength={200}
          defaultValue={values.description}
          aria-invalid={descriptionError ? true : undefined}
          aria-describedby={descriptionError ? "zone-description-error" : undefined}
        />
        {descriptionError && (
          <p id="zone-description-error" className="text-sm text-destructive">
            {descriptionError}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Center of the zone</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="zone-latitude">Latitude</Label>
            <Input
              id="zone-latitude"
              name="latitude"
              type="number"
              step="any"
              inputMode="decimal"
              required
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              aria-invalid={latitudeError ? true : undefined}
              aria-describedby={
                latitudeError ? "zone-coordinates-help zone-latitude-error" : "zone-coordinates-help"
              }
              className="h-11"
            />
            {latitudeError && (
              <p id="zone-latitude-error" className="text-sm text-destructive">
                {latitudeError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="zone-longitude">Longitude</Label>
            <Input
              id="zone-longitude"
              name="longitude"
              type="number"
              step="any"
              inputMode="decimal"
              required
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              aria-invalid={longitudeError ? true : undefined}
              aria-describedby={
                longitudeError
                  ? "zone-coordinates-help zone-longitude-error"
                  : "zone-coordinates-help"
              }
              className="h-11"
            />
            {longitudeError && (
              <p id="zone-longitude-error" className="text-sm text-destructive">
                {longitudeError}
              </p>
            )}
          </div>
        </div>
        <p id="zone-coordinates-help" className="text-sm text-muted-foreground">
          Example: 13.1953, 123.6886
        </p>
        <Button
          type="button"
          variant="outline"
          aria-expanded={showPicker}
          onClick={() => setShowPicker((shown) => !shown)}
          className="h-11 self-start px-4 text-[13px]"
        >
          <MapPin data-icon="inline-start" />
          {showPicker ? "Hide map" : "Pick on map"}
        </Button>
        {showPicker && (
          // isolate keeps Leaflet's z-indexes (400+) below the mobile sidebar sheet (z-50).
          <div className="isolate flex flex-col gap-2">
            <ZoneLocationPicker point={toPoint(latitude, longitude)} onPick={pick} />
            <p className="text-sm text-muted-foreground">
              Tap the center of the zone, inside the dashed Barangay Mi-isi boundary, to fill in the coordinates.
            </p>
            <p role="status" className="text-sm text-destructive empty:hidden">
              {pickedOutside ? OUTSIDE_MI_ISI_MESSAGE : null}
            </p>
          </div>
        )}
      </fieldset>

      <Button type="submit" disabled={pending} className="h-11 self-start px-5 text-[13px]">
        {pending ? "Saving…" : zone ? "Save zone" : "Add zone"}
      </Button>
    </form>
  );
}
