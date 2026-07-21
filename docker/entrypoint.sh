#!/bin/sh
set -eu

mkdir -p /data /app/public/uploads
export DATABASE_URL="${DATABASE_URL:-file:/data/janark.db}"

echo "[janark] syncing Prisma schema → ${DATABASE_URL}"
./node_modules/.bin/prisma db push --accept-data-loss

echo "[janark] starting Next.js on :${PORT:-3000}"
exec ./node_modules/.bin/next start -H "${HOSTNAME:-0.0.0.0}" -p "${PORT:-3000}"
