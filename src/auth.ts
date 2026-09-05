import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { ensureDbUser } from "@/lib/users";
export const { handlers, auth, signIn, signOut } = NextAuth({providers:[GitHub],callbacks:{async signIn({user}){await ensureDbUser(user);return true;}}});
