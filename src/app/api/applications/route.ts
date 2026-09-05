import { db } from "@/db";
import { applications } from "@/db/schema";
import { createApplicationSchema } from "@/lib/applications/schema";
import { listApplicationsForUser } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";
export async function GET(){try{const user=await requireCurrentUser();return Response.json(await listApplicationsForUser(user.id));}catch{return Response.json({error:"Unauthorized"},{status:401});}}
export async function POST(request:Request){try{const user=await requireCurrentUser();const payload=createApplicationSchema.parse(await request.json());const [created]=await db.insert(applications).values({...payload,vacancyUrl:payload.vacancyUrl||null,userId:user.id}).returning();return Response.json(created,{status:201});}catch(error){return Response.json({error:error instanceof Error?error.message:"Invalid request"},{status:400});}}
