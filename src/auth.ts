import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { verifyCredentials } from "@/lib/auth/credentials";
import { prisma } from "@/lib/db";

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
  session: { strategy: "jwt" },
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
