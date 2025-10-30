#!/bin/sh
set -e

echo "[entrypoint] Starting container entrypoint"

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] DATABASE_URL is set, attempting to run Prisma migrations (prisma migrate deploy)"

  # Create writable cache directories for npm/pnpm when running as non-root user.
  # Some base images have users with HOME=/nonexistent which causes npm/pnpm to fail.
  mkdir -p /tmp/.npm /tmp/.pnpm-store /tmp/.cache || true

  # Ensure the current user can write to these directories. If chown fails (e.g. running
  # as root in some CI), ignore the error.
  chown -R $(id -u):$(id -g) /tmp/.npm /tmp/.pnpm-store /tmp/.cache || true

  # Point npm/pnpm home/cache to tmp so they don't try to write to /nonexistent
  export HOME=/tmp
  export npm_config_cache=/tmp/.npm
  export XDG_CACHE_HOME=/tmp/.cache
  export PNPM_HOME=/tmp/.pnpm-store

  # Prefer pnpm (should be available via corepack). Fall back to npx if needed.
  if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
    echo "[entrypoint] migrations directory found, running migrate deploy"
    if command -v pnpm >/dev/null 2>&1; then
      pnpm prisma migrate deploy || echo "[entrypoint] pnpm prisma migrate deploy failed"
    elif command -v npx >/dev/null 2>&1; then
      npx prisma migrate deploy || echo "[entrypoint] npx prisma migrate deploy failed"
    else
      echo "[entrypoint] pnpm/npx not found, cannot run migrate deploy"
    fi
  else
    echo "[entrypoint] no migrations found, running prisma db push to sync schema"
    if command -v pnpm >/dev/null 2>&1; then
      pnpm prisma db push || echo "[entrypoint] pnpm prisma db push failed"
    elif command -v npx >/dev/null 2>&1; then
      npx prisma db push || echo "[entrypoint] npx prisma db push failed"
    else
      echo "[entrypoint] pnpm/npx not found, cannot run prisma db push"
    fi
  fi
else
  echo "[entrypoint] DATABASE_URL not set, skipping prisma migrations"
fi

echo "[entrypoint] Starting server"
exec node server.js
