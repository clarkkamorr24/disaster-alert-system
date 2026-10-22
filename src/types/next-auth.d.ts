import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    sessionVersion: number;
  }

  interface Session {
    user: {
      id: string;
      sessionVersion: number;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt only re-exports this module, so the augmentation has to target it directly.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    sessionVersion: number;
  }
}
