#!/bin/sh
set -eu

# When started as root (default image user), fix volume ownership then drop to nextjs.
# Host `docker cp` into /data often leaves files owned by the host UID → SQLITE_READONLY.
if [ "$(id -u)" = "0" ]; then
  mkdir -p /data /app/apps/web/public/uploads
  chown -R nextjs:nodejs /data /app/apps/web/public/uploads
  if [ -f /data/janark.db ]; then
    chown nextjs:nodejs /data/janark.db
    chmod 664 /data/janark.db
  fi
  exec runuser -u nextjs -- "$0" "$@"
fi

mkdir -p /data /app/apps/web/public/uploads
export DATABASE_URL="${DATABASE_URL:-file:/data/janark.db}"

echo "[janark] syncing Prisma schema → ${DATABASE_URL}"
cd /app
./node_modules/.bin/prisma db push --schema=prisma/schema.prisma --accept-data-loss

echo "[janark] starting Next.js (@janark/web) on :${PORT:-3000}"
cd /app/apps/web
exec /app/node_modules/.bin/next start -H "${HOSTNAME:-0.0.0.0}" -p "${PORT:-3000}"
