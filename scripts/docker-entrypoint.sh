#!/bin/sh
set -e

echo "[entrypoint] Starting container entrypoint"

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] DATABASE_URL is set, attempting to run Prisma migrations (prisma migrate deploy)"
  # Run migrations if the prisma binary is available. If it fails, print error and continue
  if command -v npx >/dev/null 2>&1; then
    npx prisma migrate deploy || echo "[entrypoint] prisma migrate deploy failed or nothing to do"
  else
    echo "[entrypoint] npx not found, skipping prisma migrate deploy"
  fi
else
  echo "[entrypoint] DATABASE_URL not set, skipping prisma migrations"
fi

echo "[entrypoint] Starting server"
exec node server.js
