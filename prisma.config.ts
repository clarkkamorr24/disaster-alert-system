import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma does not load env files itself. Match Next.js: .env.development, then .env.
config({ path: [".env.development", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
