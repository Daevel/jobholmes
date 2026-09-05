import "server-only";

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
    throw new Error("We could not extract readable text from this PDF. Please upload a text-based PDF.");
  }

  return text;
}
