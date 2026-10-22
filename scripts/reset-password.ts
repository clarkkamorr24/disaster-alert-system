import { createSeedClient } from "../prisma/seed-client";
import { hashPassword } from "../src/lib/auth/password";
import { newPasswordSchema } from "../src/lib/validation/account";

const USAGE = 'Usage: npm run account:reset-password -- "<new password, 10+ chars>"';

const prisma = createSeedClient();

/** Sets a new password on the officer account and signs out every device. */
async function main(): Promise<void> {
  const password = process.argv[2];
  const parsed = newPasswordSchema.safeParse(password ?? "");
  if (!parsed.success) {
    if (password) console.error(parsed.error.issues[0].message);
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  const officer = await prisma.officer.findFirst({ select: { id: true, email: true } });
  if (!officer) {
    console.error("No officer account. Run npm run db:seed first.");
    process.exitCode = 1;
    return;
  }

  await prisma.officer.update({
    where: { id: officer.id },
    data: { passwordHash: await hashPassword(parsed.data), sessionVersion: { increment: 1 } },
  });
  console.log(`Password reset for ${officer.email}. All devices are signed out.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
