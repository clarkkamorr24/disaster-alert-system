/** A saved zone, as the edit form needs it. */
export interface ZoneFormValues {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
}
