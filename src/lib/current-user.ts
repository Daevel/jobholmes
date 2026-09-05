import { auth } from "@/auth";
import { ensureDbUser } from "@/lib/users";
export async function requireCurrentUser(){const session=await auth();if(!session?.user?.email) throw new Error("UNAUTHORIZED");return ensureDbUser(session.user);}
