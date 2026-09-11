#!/usr/bin/env bash
# Vercel runs `npm run build` for both Preview and Production deploys and sets VERCEL_ENV
# accordingly. Locally (npm run build with no VERCEL_ENV) this stays a plain `next build`, so
# db:push-based local development is never blocked by the migrations check — see
# scripts/check-migrations.ts and the "Migrations" section in README.md.
set -euo pipefail

if [ -n "${VERCEL_ENV:-}" ]; then
  echo "[build] VERCEL_ENV=${VERCEL_ENV} — verifying database migrations before building..."
  npm run db:check
fi

next build
