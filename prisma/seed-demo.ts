import { normalizePhilippineMobile } from "../src/lib/domain/phone";
import { createSeedClient } from "./seed-client";

if (process.env.SMS_DRIVER !== "fake") {
  console.error("seed-demo only runs with SMS_DRIVER=fake so demo numbers never receive real SMS.");
  process.exit(1);
}

const prisma = createSeedClient();

/** A square demo area centered on a point, as the GeoJSON Polygon `FarmZone.boundary` stores. */
function squareAround(latitude: number, longitude: number, half = 0.003) {
  const ring = [
    [longitude - half, latitude - half],
    [longitude + half, latitude - half],
    [longitude + half, latitude + half],
    [longitude - half, latitude + half],
  ];
  return { type: "Polygon", coordinates: [[...ring, ring[0]]] };
}

// Placeholder centers and square areas inside Barangay Mi-isi for the demo, not the real puroks.
const DEMO_ZONES = [
  { name: "Purok 1", latitude: 13.188, longitude: 123.685, boundary: squareAround(13.188, 123.685), color: "sky" },
  { name: "Purok 2", latitude: 13.2, longitude: 123.692, boundary: squareAround(13.2, 123.692), color: "violet" },
  { name: "Purok 3", latitude: 13.215, longitude: 123.695, boundary: squareAround(13.215, 123.695), color: "pink" },
];

// The last number ends in 0000, which the fake SMS driver marks Skipped.
const DEMO_MEMBERS = [
  { firstName: "Juan", lastName: "Dela Cruz", phone: "09170000001", zone: "Purok 1", crops: "Palay" },
  { firstName: "Maria", lastName: "Santos", phone: "09170000002", zone: "Purok 1", crops: "Mais" },
  { firstName: "Jose", lastName: "Reyes", phone: "09170000003", zone: "Purok 1", crops: "Gulay" },
  { firstName: "Ana", lastName: "Bautista", phone: "09170000004", zone: "Purok 2", crops: "Palay" },
  { firstName: "Pedro", lastName: "Garcia", phone: "09170000005", zone: "Purok 2", crops: "Abaka" },
  { firstName: "Rosa", lastName: "Mendoza", phone: "09170000006", zone: "Purok 2", crops: "Niyog" },
  { firstName: "Ramon", lastName: "Villanueva", phone: "09170000007", zone: "Purok 3", crops: "Palay" },
  { firstName: "Luz", lastName: "Ramos", phone: "09170000008", zone: "Purok 3", crops: "Kamote" },
  { firstName: "Carlos", lastName: "Aquino", phone: "09170000009", zone: "Purok 3", crops: "Saging" },
  { firstName: "Elena", lastName: "Castillo", phone: "09171230000", zone: "Purok 1", crops: "Gulay" },
];

function toCanonicalPhone(phone: string): string {
  const result = normalizePhilippineMobile(phone);
  if (!result.ok) throw new Error(`Demo phone ${phone}: ${result.error}`);
  return result.e164;
}

async function main(): Promise<void> {
  const zoneIds = new Map<string, string>();
  for (const zone of DEMO_ZONES) {
    // Location and area are updated too, so a rerun moves demo zones placed outside Mi-isi before.
    const { name, ...location } = zone;
    const saved = await prisma.farmZone.upsert({ where: { name }, update: location, create: zone });
    zoneIds.set(zone.name, saved.id);
  }
  console.log(`Zones: ${DEMO_ZONES.length} upserted`);

  const consentAt = new Date();
  for (const { zone, phone, ...member } of DEMO_MEMBERS) {
    const canonical = toCanonicalPhone(phone);
    await prisma.member.upsert({
      where: { phone: canonical },
      update: {},
      create: { ...member, phone: canonical, consentAt, zoneId: zoneIds.get(zone)! },
    });
  }
  console.log(`Members: ${DEMO_MEMBERS.length} upserted`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
