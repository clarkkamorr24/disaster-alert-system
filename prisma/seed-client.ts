import { config } from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

// Seed scripts run outside Next.js, so load the env files the same way prisma.config.ts does.
config({ path: [".env.development", ".env"], quiet: true });

/**
 * Creates a Prisma client for the seed scripts.
 *
 * `src/lib/db.ts` imports `server-only`, which throws outside Next.js, so the
 * seeds build their own client with the same Neon adapter.
 */
export function createSeedClient(): PrismaClient {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}
