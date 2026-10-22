import type { Officer } from "@/generated/prisma/client";

/** The officer fields needed to check a sign-in. */
export type DbOfficer = Pick<Officer, "id" | "name" | "email" | "passwordHash" | "sessionVersion">;

/** The officer as carried in the JWT and the session. */
export interface SessionOfficer {
  id: string;
  name: string;
  email: string;
  sessionVersion: number;
}
