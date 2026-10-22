import { hashPassword } from "../src/lib/auth/password";
import { createSeedClient } from "./seed-client";

const prisma = createSeedClient();

const DEFAULT_TEMPLATES = [
  {
    name: "General hazard alert",
    body: "{hazard} - {level}. Apektadong lugar: {zones}. Mag-ingat at sundin ang abiso ng barangay. ({date})",
  },
  {
    name: "All clear",
    body: "Wala nang banta ng {hazard} sa {zones}. Maaari nang bumalik nang maingat. ({date})",
  },
];

/** Creates the one officer account, but only when none exists, so reruns never touch the password. */
async function seedOfficer(): Promise<void> {
  if ((await prisma.officer.count()) > 0) {
    console.log("Officer: skipped (an officer account already exists)");
    return;
  }

  const email = process.env.SEED_OFFICER_EMAIL?.trim();
  const password = process.env.SEED_OFFICER_PASSWORD;
  if (!email || !password) {
    throw new Error("Set SEED_OFFICER_EMAIL and SEED_OFFICER_PASSWORD in .env");
  }

  const officer = await prisma.officer.create({
    data: {
      name: "Association Officer",
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
    },
  });
  console.log(`Officer: created ${officer.email}`);
}

async function seedTemplates(): Promise<void> {
  for (const template of DEFAULT_TEMPLATES) {
    const existing = await prisma.messageTemplate.findUnique({ where: { name: template.name } });
    if (existing) {
      console.log(`Template "${template.name}": skipped (already exists)`);
      continue;
    }
    await prisma.messageTemplate.create({ data: template });
    console.log(`Template "${template.name}": created`);
  }
}

async function main(): Promise<void> {
  await seedOfficer();
  await seedTemplates();
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
