---
name: testing-and-verification
description: Use for any code change in this repo — testing conventions and the required build/typecheck/test verification before considering work done. Prevents new mocking frameworks, real-DB/real-API tests, or skipped verification.
---

# Testing & verification conventions

For general project invariants, see `AGENTS.md` — this skill only covers how tests are written and what to run before calling a change complete.

## Objective

Keep the test suite fast, deterministic, and dependency-free, and make sure every code change is actually verified before it's considered done.

## Scope

- `tests/` — every test file (`node:test` + `node:assert/strict`).
- `package.json` scripts: `typecheck`, `build`, `test`.

## Constraints

- **`node:test` + `node:assert/strict` only** — no Jest, Vitest, Mocha, or any mocking library. Look at an existing file in `tests/` (e.g. `tests/ai-match.test.ts`, `tests/job-fit-signature.test.ts`) for the established style before adding a new one.
- **No test connects to a real database or calls a real external API** (OpenAI, Vercel Blob, Google Sheets). There is no test database and no recorded-fixture/mocking harness in this repo — don't add one to make an I/O-coupled path "testable."
- **Prefer extracting pure logic over testing I/O-coupled code.** If a function mixes business logic with a database call or an API request, the logic worth testing usually belongs in its own pure function (see how `src/lib/ai/scoring.ts` and `src/lib/applications/cv-rejection-prompt.ts` are structured) rather than reaching for a mock to test the whole thing.
- If some behavior genuinely can't be tested without a real database or external API, verify it manually and say so (in the PR/commit description or task summary) instead of building a new test harness for it.

## Required verification

Before considering any code change complete:
```bash
npm run typecheck
npm run build
npm test
```
All three clean, every time — not just the test file touched by the change, since shared modules (e.g. `src/lib/i18n/`, `src/lib/applications/display.ts`, `src/lib/ai/scoring.ts`) are exercised by tests across multiple files.

## Stop conditions

If testing something seems to require a real test database or mocking a real external API (OpenAI, Vercel Blob, Google Sheets), stop and ask for explicit confirmation before introducing that infrastructure — don't add it unilaterally.
