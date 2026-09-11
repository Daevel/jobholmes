import test from "node:test";
import assert from "node:assert/strict";

process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-only-job-fit-signature-secret";

import { signJobFitResult, verifyJobFitSignature, type JobFitSignaturePayload } from "@/lib/ai/job-fit-signature";

function basePayload(): JobFitSignaturePayload {
  return {
    userId: "11111111-1111-1111-1111-111111111111",
    cvDocumentId: "22222222-2222-2222-2222-222222222222",
    jdText: "We are looking for a Senior Engineer with TypeScript experience.",
    score: 82,
    matchClass: "A_STRONG",
    confidence: 90,
    requirementsAndGapsJson: JSON.stringify({ version: 1, requirements: [] }),
    expiresAt: Date.now() + 30 * 60 * 1000,
  };
}

test("signing and verifying an unmodified payload succeeds", () => {
  const payload = basePayload();
  const signature = signJobFitResult(payload);

  assert.equal(verifyJobFitSignature(payload, signature), true);
});

test("altering the score after signing fails verification", () => {
  const payload = basePayload();
  const signature = signJobFitResult(payload);

  assert.equal(verifyJobFitSignature({ ...payload, score: (payload.score ?? 0) + 1 }, signature), false);
});

test("altering the cvDocumentId after signing fails verification", () => {
  const payload = basePayload();
  const signature = signJobFitResult(payload);

  assert.equal(verifyJobFitSignature({ ...payload, cvDocumentId: "33333333-3333-3333-3333-333333333333" }, signature), false);
});

test("altering the jdText after signing fails verification", () => {
  const payload = basePayload();
  const signature = signJobFitResult(payload);

  assert.equal(verifyJobFitSignature({ ...payload, jdText: `${payload.jdText} Extra requirement.` }, signature), false);
});

test("altering the requirementsAndGapsJson after signing fails verification", () => {
  const payload = basePayload();
  const signature = signJobFitResult(payload);

  assert.equal(verifyJobFitSignature({ ...payload, requirementsAndGapsJson: JSON.stringify({ version: 1, requirements: ["tampered"] }) }, signature), false);
});

test("an expired signature fails verification even with an identical payload", () => {
  const payload = { ...basePayload(), expiresAt: Date.now() - 1000 };
  const signature = signJobFitResult(payload);

  assert.equal(verifyJobFitSignature(payload, signature), false);
});

test("a signature generated for a different userId fails verification", () => {
  const payload = basePayload();
  const signature = signJobFitResult(payload);

  assert.equal(verifyJobFitSignature({ ...payload, userId: "99999999-9999-9999-9999-999999999999" }, signature), false);
});

test("a malformed signature string fails verification instead of throwing", () => {
  const payload = basePayload();

  assert.equal(verifyJobFitSignature(payload, "not-a-valid-hex-signature"), false);
});
