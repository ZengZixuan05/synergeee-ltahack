# syntax=docker/dockerfile:1

# GoAble SG — container image for Google Cloud Run.
#
# This is a single Next.js 16 app: the frontend AND the backend API route
# (src/app/api/places/search, backed by src/lib/onemap.server.ts) run in the
# same `next start` / standalone server. Cloud Run runs this container as a
# Node server (the app can no longer be statically exported — see
# next.config.mjs).
#
# IMPORTANT — two classes of env vars:
#   * NEXT_PUBLIC_* (Firebase web config, map style URL) are inlined into the
#     browser bundle at BUILD time, so they must be passed as --build-arg here.
#     They are NOT secret.
#   * ONEMAP_* credentials are read only at RUNTIME by the server. Do NOT bake
#     them into the image — inject them as Cloud Run env vars / secrets.

# ---- Stage 1: install dependencies -----------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Stage 2: build ---------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Build-time public config (inlined into the client bundle). Provided via
# --build-arg / Cloud Build substitutions. Safe to expose to the browser.
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_MAP_STYLE_URL

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID \
    NEXT_PUBLIC_MAP_STYLE_URL=$NEXT_PUBLIC_MAP_STYLE_URL \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# Ensure a public/ dir exists even if the repo has none, so the runtime
# stage's `COPY --from=builder /app/public` always succeeds.
RUN mkdir -p public

# ---- Stage 3: runtime -------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone output: a self-contained server + only the node_modules it needs.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Cloud Run sends traffic to $PORT (default 8080). The standalone server.js
# honours PORT and HOSTNAME from the environment.
EXPOSE 8080
CMD ["node", "server.js"]
