import { useEffect, useState } from "react";

/**
 * A key that changes every time the component's effects are cleaned up: when
 * Next.js hides the route in `<Activity>` on navigation (Cache Components), or
 * when it unmounts. Keying a child with it makes React mount that child fresh
 * when the route is shown again, instead of re-running its effects.
 *
 * Needed for react-leaflet: `MapContainer` destroys the Leaflet map in its
 * cleanup but only creates it on first mount, so re-shown layers would be
 * added to a removed map ("Cannot read properties of undefined (reading 'appendChild')").
 *
 * @returns A number to pass as the child's `key`.
 */
export function useRemountKey(): number {
  const [key, setKey] = useState(0);
  // The update is deferred while hidden and applied in the render that shows the route again.
  useEffect(() => () => setKey((current) => current + 1), []);
  return key;
}
