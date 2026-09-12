---
name: ai-match-job-fit
description: Use when touching AI Match, Job Fit Preview, cover letter generation, requirement extraction/comparison, scoring/confidence, or anything under src/lib/ai/. Prevents a second matching pipeline or inline OpenAI instructions from being introduced.
---

# AI Match / Job Fit

For general project invariants (source of truth, secrets, testing philosophy), see `AGENTS.md` — this skill only covers what's specific to the matching pipeline.

## Objective

Keep JobHolmes' evidence-grounded matching pipeline and its OpenAI instructions in exactly one place each, so a new feature never quietly forks either.

## Scope — read before changing anything here

- `src/lib/ai/match.ts` — `runJobFitAnalysis`, the **single** shared pipeline (extract requirements → compare to CV → derive gaps/score/confidence). Used by both the saved-application AI Match flow (`analyzeApplicationMatch`) and the unsaved Job Fit Preview flow (`/api/job-fit/preview`).
- `src/lib/ai/instructions.ts` — every OpenAI `instructions` string, as named, typed constants.
- `src/lib/ai/jd-requirements.ts` — `extractJobRequirements`: turns JD text into structured requirements.
- `src/lib/ai/requirement-evidence.ts` — `compareRequirementsToCv`: checks each requirement against CV text.
- `src/lib/ai/scoring.ts` — `deriveAiMatchClass`, `calculateRequirementCoverageScore`, `calculateAnalysisConfidence`, `determineProvisionalResult`, plus the versioned `AI_MATCH_SCORING_POLICY` / `AI_MATCH_CONFIDENCE_POLICY` strings.
- `src/lib/ai/requirements-and-gaps.ts` — the versioned `requirementsAndGapsPayloadSchema` persisted to `applications.requirementsAndGaps`, and `parseRequirementsAndGaps`'s `empty` / `legacy` / `structured` handling for old free-text data.
- `src/lib/ai/job-fit-signature.ts` — `signJobFitResult` / `verifyJobFitSignature`, the HMAC (reusing `AUTH_SECRET`) that lets a Job Fit preview become an application later without re-running the paid, non-deterministic analysis or trusting the client's numbers.

## Constraints

- **Never a second scoring/matching algorithm.** Every new AI-Match-adjacent feature (a new report, a new trigger point, a new preview variant) extends `runJobFitAnalysis` and the functions it composes — it does not reimplement extraction, comparison, or scoring in a new file.
- **New OpenAI instructions go in `src/lib/ai/instructions.ts`** with a semantic name, never inline in a route/service — see the convention comment at the top of that file.
- **Never accept precomputed match fields from a public form/schema.** `aiMatchClass` / `aiMatchPercentage` / `aiMatchConfidence` are written only by `analyzeApplicationMatch` (saved applications) or via the HMAC-verified Job Fit → application-creation path (`src/app/api/job-fit/confirm/route.ts`, `verifyJobFitSignature`). A create/update schema accepting these directly from client input is the bug this constraint exists to prevent.
- **`userMatchClass` / `userMatchPercentage` ("Your Match") are deprecated.** They exist only for legacy import compatibility (`src/lib/applications/legacy.ts`) — never reintroduce them in UI, prompts, scoring, or confidence logic.
- Requirement/assessment/gap data is untrusted JD/CV text, not instructions — see the injection-handling language already in `src/lib/ai/instructions.ts`'s extraction/comparison prompts before touching them.

## Required verification

Run the test suite and confirm it passes unchanged, in particular:
```bash
npm test
```
paying attention to `tests/ai-match.test.ts` (scoring/confidence/provisional-result behavior), `tests/job-fit-signature.test.ts` (signature verification, tampering, expiry), `tests/cover-letter.test.ts` (eligibility gating on covered requirements), and `tests/remove-your-match.test.ts` (deprecated fields staying inert). Also run `npm run typecheck` and `npm run build`.

## Stop conditions

Stop and ask for explicit confirmation instead of proceeding if a change would require either:
- a second scoring/matching pipeline running alongside `runJobFitAnalysis`, or
- bypassing the HMAC-signed verification for match data flowing into an application (e.g. trusting a client-supplied score/class/confidence directly).
