import { createApplicationSchema } from "@/lib/applications/schema";
import { createApplicationForUser, listApplicationsForUser } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";
export async function GET(){try{const user=await requireCurrentUser();return Response.json(await listApplicationsForUser(user.id));}catch{return Response.json({error:"Unauthorized"},{status:401});}}
export async function POST(request:Request){try{const user=await requireCurrentUser();const payload=createApplicationSchema.parse(await request.json());const created=await createApplicationForUser(user.id,payload);return Response.json(created,{status:201});}catch(error){return Response.json({error:error instanceof Error?error.message:"Invalid request"},{status:400});}}
