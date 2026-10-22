import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma does not load env files itself. Match Next.js: .env.development, then .env.
config({ path: [".env.development", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // process.env, not env(): `prisma generate` runs on install (e.g. Vercel) without a database URL.
    url: process.env.DIRECT_URL,
  },
});
