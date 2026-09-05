import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cvDocuments } from "@/db/schema";

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
