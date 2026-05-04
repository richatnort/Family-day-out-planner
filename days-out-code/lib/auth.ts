import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logger } from "./logger";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "pin",
      name: "Family PIN",
      credentials: {
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ pin: z.string().min(1).max(20) })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const pinHash = process.env.FAMILY_PIN_HASH;
        if (!pinHash) {
          logger.error("FAMILY_PIN_HASH env var not set");
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.pin, pinHash);
        if (!valid) return null;

        return { id: "family", role: "pin" };
      },
    }),
  ],
  pages: {
    signIn: "/pin",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as string | undefined;
      return session;
    },
  },
});
