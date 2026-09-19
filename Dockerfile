# syntax=docker/dockerfile:1

# GoAble SG (JourneyAheadSG) — container image for the FRONTEND on Google
# Cloud Run. This builds only frontend/ (a Next.js 16 app whose own API
# routes — frontend/src/app/api/places/search, .../transport/facilities —
# run in the same `next start` / standalone server). The standalone
# backend/ Express service is a separate deployable and is NOT built by
# this Dockerfile — see backend/README.md.
#
# IMPORTANT — this repo is a monorepo (frontend/, backend/) with NO
# frontend/package.json: `next build` resolves node_modules from the repo
# root, so Next.js infers the *repo root* as the workspace root and nests
# its standalone output accordingly: server.js ends up at
# frontend/.next/standalone/frontend/server.js, not
# frontend/.next/standalone/server.js. Every COPY below accounts for that
# extra `frontend/` nesting — don't "simplify" them without re-checking
# where a real `npm run build` actually puts server.js.
#
# IMPORTANT — two classes of env vars:
#   * NEXT_PUBLIC_* (Firebase web config, map style URL) are inlined into the
#     browser bundle at BUILD time, so they must be passed as --build-arg here.
#     They are NOT secret.
#   * ONEMAP_* credentials and BACKEND_BASE_URL are read only at RUNTIME by
#     the server. Do NOT bake them into the image — inject them as Cloud Run
#     env vars / secrets.

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
# Ensure frontend/public exists even though this repo has no such directory
# today, so the runtime stage's COPY below always succeeds.
RUN mkdir -p frontend/public

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
# Paths below are all `frontend/`-nested — see the top-of-file note on why.
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone/. ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

# Next's standalone output emits only ONE package.json, mirroring the
# monorepo root's — which has "type": "module" (the backend/ workspace
# needs it; the frontend doesn't). With no frontend/package.json of its
# own, Node resolves frontend/server.js's module type from that root one
# and fails ("require is not defined in ES module scope"), since
# server.js is actually CommonJS. This overrides module-type resolution
# for everything under frontend/ before Node looks further up the tree.
RUN printf '{"type":"commonjs"}' > frontend/package.json

USER nextjs

# Cloud Run sends traffic to $PORT (default 8080). The standalone server.js
# honours PORT and HOSTNAME from the environment.
EXPOSE 8080
CMD ["node", "frontend/server.js"]
