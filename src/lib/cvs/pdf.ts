import "server-only";

import { t } from "@/lib/i18n/translate";

export async function extractPdfText(bytes: Buffer) {
  const { CanvasFactory } = await import("pdf-parse/worker");
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: bytes, CanvasFactory });
  let text = "";

  try {
    const result = await parser.getText();
    text = result.text.trim();
  } finally {
    await parser.destroy();
  }

  if (text.length < 50) {
    throw new Error(t("cvs.upload.errors.noReadableText"));
  }

  return text;
}
