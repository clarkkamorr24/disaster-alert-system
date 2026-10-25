"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";

import { createZone, updateZone } from "@/actions/zones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ZoneColorPicker } from "@/components/zones/zone-color-picker";
import { ZoneMapField } from "@/components/zones/zone-map-field";
import { boundaryToLatLngs, latLngsToBoundary } from "@/lib/map";
import { isRedirectError } from "@/lib/redirect-error";
import { ZONE_COLOR_KEYS, type ZoneColor } from "@/lib/zone-colors";
import type { ActionResult } from "@/types/action-result";
import type { ZoneFormValues } from "@/types/zone";

interface ZoneFormProps {
  /** The zone to edit; omit to create a new one. */
  zone?: ZoneFormValues;
  /** The color a new zone starts on. */
  defaultColor?: ZoneColor;
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

export function ZoneForm({ zone, defaultColor }: ZoneFormProps) {
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
  const [corners, setCorners] = useState(() => (zone?.boundary ? boundaryToLatLngs(zone.boundary) : null));
  const [color, setColor] = useState<ZoneColor>(zone?.color ?? defaultColor ?? ZONE_COLOR_KEYS[0]);

  function setCenter(lat: number, lng: number) {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
  }

  const nameError = fieldErrors?.name?.[0];
  const descriptionError = fieldErrors?.description?.[0];
  const latitudeError = fieldErrors?.latitude?.[0];
  const longitudeError = fieldErrors?.longitude?.[0];
  const boundaryError = fieldErrors?.boundary?.[0];

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
        <legend className="sr-only">Center and boundary of the zone</legend>
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
        <ZoneMapField
          point={toPoint(latitude, longitude)}
          onCenterChange={setCenter}
          corners={corners}
          onCornersChange={setCorners}
          color={color}
          error={boundaryError}
        />
        {/* Hidden inputs keep their value through React's form reset. */}
        <input type="hidden" name="boundary" value={corners ? JSON.stringify(latLngsToBoundary(corners)) : ""} />
      </fieldset>

      <div className="flex flex-col gap-2">
        <span id="zone-color-label" className="text-sm leading-none font-medium">
          Area color
        </span>
        <ZoneColorPicker
          value={color}
          onChange={setColor}
          labelledBy="zone-color-label"
          describedBy="zone-color-help"
        />
        <p id="zone-color-help" className="text-sm text-muted-foreground">
          Fills the drawn boundary on the map. Alert severity is still shown by the pin.
        </p>
        <input type="hidden" name="color" value={color} />
      </div>

      <Button type="submit" disabled={pending} className="h-11 self-start px-5 text-[13px]">
        {pending ? "Saving…" : zone ? "Save zone" : "Add zone"}
      </Button>
    </form>
  );
}
