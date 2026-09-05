import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
export async function ensureDbUser(authUser:{email?:string|null;name?:string|null;image?:string|null}) {
  if (!authUser.email) throw new Error("Authenticated user has no email");
  const [existing]=await db.select().from(users).where(eq(users.email,authUser.email)).limit(1);
  if (existing) return existing;
  const [created]=await db.insert(users).values({email:authUser.email,name:authUser.name??null,image:authUser.image??null}).returning();
  return created;
}
