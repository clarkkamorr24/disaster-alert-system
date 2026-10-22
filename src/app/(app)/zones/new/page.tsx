import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { BackToZones } from "@/components/zones/back-to-zones";
import { ZoneForm } from "@/components/zones/zone-form";

export const metadata: Metadata = {
  title: "New zone · Mi-isi Disaster Alert",
};

export default function NewZonePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackToZones />
        <h1 className="text-2xl font-semibold">New zone</h1>
      </div>
      <Card>
        <CardContent>
          <ZoneForm />
        </CardContent>
      </Card>
    </div>
  );
}
