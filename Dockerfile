# syntax=docker/dockerfile:1
# Monorepo production image: apps/web (Next.js) + Prisma (SQLite) + runtime Mongo via compose

FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci --ignore-scripts

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY config ./config
COPY apps/web ./apps/web

ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_ADS_ENABLED=
ARG NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_ADS_ENABLED=$NEXT_PUBLIC_ADS_ENABLED
ENV NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=$NEXT_PUBLIC_ADSENSE_PUBLISHER_ID
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:./prisma/dev.db"

RUN npm rebuild better-sqlite3 \
  && npx prisma generate --schema=prisma/schema.prisma \
  && npm run build -w @janark/web \
  && npm prune --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=builder /app/apps/web/src/generated ./apps/web/src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# prisma is a devDependency; ensure CLI exists after prune for boot-time db push
RUN npm install prisma@7.9.0 --omit=dev --no-save \
  && rm -rf /root/.npm

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
  && mkdir -p /data /app/apps/web/public/uploads \
  && chown -R nextjs:nodejs /app /data

# Entrypoint starts as root to chown named volumes, then drops to nextjs via runuser.
USER root
EXPOSE 3000
VOLUME ["/data", "/app/apps/web/public/uploads"]
ENTRYPOINT ["/entrypoint.sh"]
