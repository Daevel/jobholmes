import "server-only";

import { extractPdfText } from "@/lib/cvs/pdf";
import { insertCvForUser, CV_MAX_FILE_SIZE_BYTES } from "@/lib/cvs/service";
import { uploadPrivateCvPdf } from "@/lib/cvs/storage";

export async function createCvForUser({ userId, name, file }: { userId: string; name: string; file: File }) {
  validatePdf(file);

  const bytes = Buffer.from(await file.arrayBuffer());
  const extractedText = await extractPdfText(bytes);
  const pathname = `cvs/${userId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const blob = await uploadPrivateCvPdf(pathname, bytes);

  return insertCvForUser({
    userId,
    name,
    originalFileName: file.name,
    storagePath: blob.pathname,
    blobUrl: blob.url,
    mimeType: file.type || "application/pdf",
    sizeBytes: file.size,
    extractedText,
  });
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

function sanitizeFileName(value: string) {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "cv.pdf";
}
