import "server-only";

import { extractPdfText } from "@/lib/cvs/pdf";
import { detectDocumentFormat, type DocumentFormat } from "@/lib/documents/detect-format";
import { t } from "@/lib/i18n/translate";

export type { DocumentFormat };
export { detectDocumentFormat };

const MIN_EXTRACTED_TEXT_LENGTH = 10;

/**
 * Extracts plain text from a .txt/.pdf/.docx file - used to populate the cover letter field from
 * an uploaded file instead of typing/pasting it. The file itself is never persisted; only the
 * extracted text is returned. The old binary .doc format is deliberately unsupported.
 */
export async function extractTextFromDocument(file: { name: string; type: string; arrayBuffer: () => Promise<ArrayBuffer> }): Promise<string> {
  const format = detectDocumentFormat(file.name, file.type);
  if (!format) throw new Error(t("documents.textExtraction.errors.unsupportedFormat"));

  const bytes = Buffer.from(await file.arrayBuffer());
  const text = await extractByFormat(format, bytes);
  const trimmed = text.trim();

  if (trimmed.length < MIN_EXTRACTED_TEXT_LENGTH) {
    throw new Error(t("documents.textExtraction.errors.emptyOrTooShort"));
  }

  return trimmed;
}

async function extractByFormat(format: DocumentFormat, bytes: Buffer): Promise<string> {
  if (format === "txt") return new TextDecoder("utf-8").decode(bytes);

  // extractPdfText already enforces its own (stricter, 50-char) readable-text threshold and
  // throws an i18n-ized error - reused as-is here rather than duplicated, per the CV upload path.
  if (format === "pdf") return extractPdfText(bytes);

  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: bytes });
  return value;
}
