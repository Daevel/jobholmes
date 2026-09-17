export type DocumentFormat = "txt" | "pdf" | "docx";

/**
 * Pure and kept in its own module (no "server-only" import, unlike extract-text.ts) so it can be
 * unit-tested directly under plain Node, the same way every other pure-logic module in this repo
 * is. The file name extension is checked first and is authoritative when present - some browsers
 * send a generic mime type (e.g. application/octet-stream) for .docx, so mime type is only a
 * fallback for when the extension itself is missing or unrecognized.
 */
export function detectDocumentFormat(fileName: string, mimeType: string): DocumentFormat | null {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";

  if (extension === "txt") return "txt";
  if (extension === "pdf") return "pdf";
  if (extension === "docx") return "docx";

  if (mimeType === "text/plain") return "txt";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";

  return null;
}
