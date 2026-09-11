import { createHash, createHmac, timingSafeEqual } from "crypto";

const matchClasses = ["A_STRONG", "B_STRETCH", "C_LONG_SHOT"] as const;
export type JobFitMatchClass = (typeof matchClasses)[number];

export type JobFitSignaturePayload = {
  userId: string;
  cvDocumentId: string;
  jdText: string;
  score: number | null;
  matchClass: JobFitMatchClass | null;
  confidence: number | null;
  requirementsAndGapsJson: string;
  expiresAt: number;
};

/**
 * Lets a Job Fit preview be turned into an application later without re-running the (paid,
 * non-deterministic) matching pipeline, while still not trusting whatever the client sends back.
 * Reuses AUTH_SECRET (Auth.js' own session-signing secret) instead of introducing a second secret.
 */
export function signJobFitResult(payload: JobFitSignaturePayload): string {
  return createHmac("sha256", getJobFitSignatureSecret()).update(canonicalPayload(payload)).digest("hex");
}

export function verifyJobFitSignature(payload: JobFitSignaturePayload, signature: string): boolean {
  if (Date.now() > payload.expiresAt) return false;

  const expected = Buffer.from(signJobFitResult(payload), "hex");
  const actual = Buffer.from(signature, "hex");
  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}

export function fingerprintJobFitText(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalPayload(payload: JobFitSignaturePayload): string {
  return JSON.stringify([
    payload.userId,
    payload.cvDocumentId,
    fingerprintJobFitText(payload.jdText),
    payload.score,
    payload.matchClass,
    payload.confidence,
    payload.requirementsAndGapsJson,
    payload.expiresAt,
  ]);
}

function getJobFitSignatureSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("MISSING_AUTH_SECRET");
  return secret;
}
