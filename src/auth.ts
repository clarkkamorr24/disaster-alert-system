import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { verifyCredentials } from "@/lib/auth/credentials";
import { prisma } from "@/lib/db";

/** How long a session lasts without activity: 30 minutes. */
export const SESSION_MAX_AGE_SECONDS = 30 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const { email, password } = credentials;
        if (typeof email !== "string" || typeof password !== "string") return null;

        return verifyCredentials(email, password, {
          findOfficerByEmail: (normalized) =>
            prisma.officer.findUnique({
              where: { email: normalized },
              select: { id: true, name: true, email: true, passwordHash: true, sessionVersion: true },
            }),
        });
      },
    }),
  ],
  // Sessions end after 30 minutes without a request. With JWT sessions Auth.js
  // re-issues the cookie with a fresh expiry on every session read (`updateAge`
  // only applies to database sessions); src/proxy.ts does that read per request.
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/sign-in" },
  callbacks: {
    jwt({ token, user }) {
      // `user` is only set on sign-in; later requests reuse the token as is.
      if (user?.id) {
        token.id = user.id;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.sessionVersion = token.sessionVersion;
      return session;
    },
  },
});
