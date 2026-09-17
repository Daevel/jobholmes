import test from "node:test";
import assert from "node:assert/strict";
import { detectDocumentFormat } from "@/lib/documents/detect-format";

test("recognizes a .txt file by extension", () => {
  assert.equal(detectDocumentFormat("cover-letter.txt", "text/plain"), "txt");
});

test("recognizes a .pdf file by extension", () => {
  assert.equal(detectDocumentFormat("cover-letter.pdf", "application/pdf"), "pdf");
});

test("recognizes a .docx file by extension", () => {
  assert.equal(
    detectDocumentFormat("cover-letter.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    "docx",
  );
});

test("returns null for the unsupported legacy .doc format", () => {
  assert.equal(detectDocumentFormat("cover-letter.doc", "application/msword"), null);
});

test("returns null for an unrecognized extension and mime type", () => {
  assert.equal(detectDocumentFormat("cover-letter.rtf", "application/rtf"), null);
});

test("falls back to a generic mime type when the extension is missing, for .docx", () => {
  assert.equal(
    detectDocumentFormat("cover-letter", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    "docx",
  );
});

test("extension is authoritative even when the mime type is a generic octet-stream", () => {
  // Some browsers send application/octet-stream for .docx - the extension must still win.
  assert.equal(detectDocumentFormat("cover-letter.docx", "application/octet-stream"), "docx");
});

test("extension detection is case-insensitive", () => {
  assert.equal(detectDocumentFormat("Cover-Letter.PDF", "application/pdf"), "pdf");
});
