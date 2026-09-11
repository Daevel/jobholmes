import "server-only";

import { and, count, eq, desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { applications, cvDocuments } from "@/db/schema";
import { deletePrivateCvPdf } from "@/lib/cvs/storage";

export const CV_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export type CvDocument = typeof cvDocuments.$inferSelect;

export function listCvsForUser(userId: string) {
  return db
    .select({
      id: cvDocuments.id,
      name: cvDocuments.name,
      originalFileName: cvDocuments.originalFileName,
      mimeType: cvDocuments.mimeType,
      sizeBytes: cvDocuments.sizeBytes,
      createdAt: cvDocuments.createdAt,
      updatedAt: cvDocuments.updatedAt,
    })
    .from(cvDocuments)
    .where(eq(cvDocuments.userId, userId))
    .orderBy(desc(cvDocuments.createdAt));
}

export async function getCvForUser(userId: string, cvId: string) {
  const [cv] = await db
    .select()
    .from(cvDocuments)
    .where(and(eq(cvDocuments.userId, userId), eq(cvDocuments.id, cvId)))
    .limit(1);

  return cv ?? null;
}

export async function countApplicationsUsingCv(userId: string, cvId: string, options?: { excludeApplicationId?: string }) {
  const conditions = [eq(applications.userId, userId), eq(applications.cvDocumentId, cvId)];
  if (options?.excludeApplicationId) conditions.push(ne(applications.id, options.excludeApplicationId));

  const [row] = await db
    .select({ count: count() })
    .from(applications)
    .where(and(...conditions));

  return row?.count ?? 0;
}

export type DeleteCvResult = { deleted: true } | { deleted: false; blockedByApplicationCount: number };

export async function deleteCvForUser(userId: string, cvId: string): Promise<DeleteCvResult | null> {
  const cv = await getCvForUser(userId, cvId);
  if (!cv) return null;

  const usageCount = await countApplicationsUsingCv(userId, cvId);
  if (usageCount > 0) {
    return { deleted: false, blockedByApplicationCount: usageCount };
  }

  await deletePrivateCvPdf(cv.storagePath);
  await db.delete(cvDocuments).where(and(eq(cvDocuments.userId, userId), eq(cvDocuments.id, cvId)));

  return { deleted: true };
}

export async function insertCvForUser({
  userId,
  name,
  originalFileName,
  storagePath,
  blobUrl,
  mimeType,
  sizeBytes,
  extractedText,
}: {
  userId: string;
  name: string;
  originalFileName: string;
  storagePath: string;
  blobUrl: string;
  mimeType: string;
  sizeBytes: number;
  extractedText: string;
}) {
  const [cv] = await db
    .insert(cvDocuments)
    .values({
      userId,
      name,
      originalFileName,
      storagePath,
      blobUrl,
      mimeType,
      sizeBytes,
      extractedText,
    })
    .returning();

  return cv;
}
