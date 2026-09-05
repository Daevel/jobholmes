import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications } from "@/db/schema";
export function listApplicationsForUser(userId:string){return db.select().from(applications).where(eq(applications.userId,userId)).orderBy(desc(applications.appliedAt));}
export async function getApplicationForUser(userId:string,applicationId:string){const [row]=await db.select().from(applications).where(and(eq(applications.userId,userId),eq(applications.id,applicationId))).limit(1);return row??null;}
