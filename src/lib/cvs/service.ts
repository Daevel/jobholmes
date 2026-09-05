import "server-only";

import { get, put } from "@vercel/blob";
import { and, desc, eq } from "drizzle-orm";
import { PDFParse } from "pdf-parse";
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

export async function createCvForUser({ userId, name, file }: { userId: string; name: string; file: File }) {
  validatePdf(file);

  const bytes = Buffer.from(await file.arrayBuffer());
  const extractedText = await extractPdfText(bytes);
  const pathname = `cvs/${userId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const blob = await put(pathname, bytes, {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
  });

  const [cv] = await db
    .insert(cvDocuments)
    .values({
      userId,
      name,
      originalFileName: file.name,
      storagePath: blob.pathname,
      blobUrl: blob.url,
      mimeType: file.type || "application/pdf",
      sizeBytes: file.size,
      extractedText,
    })
    .returning();

  return cv;
}

export async function getCvDownloadForUser(userId: string, cvId: string) {
  const cv = await getCvForUser(userId, cvId);
  if (!cv) return null;

  const blob = await get(cv.storagePath, { access: "private" });
  if (!blob || blob.statusCode !== 200) return null;

  return { cv, blob };
}

function validatePdf(file: File) {
  const extensionIsPdf = file.name.toLowerCase().endsWith(".pdf");
  const typeIsPdf = file.type === "application/pdf" || file.type === "application/octet-stream";

  if (!extensionIsPdf || !typeIsPdf) {
    throw new Error("Only PDF files are supported.");
  }

  if (file.size <= 0) {
    throw new Error("Upload a valid PDF file.");
  }

  if (file.size > CV_MAX_FILE_SIZE_BYTES) {
    throw new Error("PDF files must be 5 MB or smaller.");
  }
}

async function extractPdfText(bytes: Buffer) {
  const parser = new PDFParse({ data: bytes });
  let text = "";
  try {
    const result = await parser.getText();
    text = result.text.trim();
  } finally {
    await parser.destroy();
  }

  if (text.length < 50) {
    throw new Error("We could not extract readable text from this PDF. Please upload a text-based PDF.");
  }

  return text;
}

function sanitizeFileName(value: string) {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "cv.pdf";
}
