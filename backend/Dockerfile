# syntax=docker/dockerfile:1

# Standalone backend (Express) — container image for Google Cloud Run.
# Self-contained: the build context is backend/ itself (its own
# package.json/package-lock.json/tsconfig.json/src/), independent of the
# frontend's Dockerfile at the repo root — a separate Cloud Run service.
#
# LTA_ACCOUNT_KEY / ONEMAP_API_KEY are read at RUNTIME from process.env —
# never baked into the image. In production they're injected as Cloud Run
# secrets (see the repo-root README, "Deploying to Google Cloud Run").

# ---- Stage 1: install all dependencies (needed to run `tsc`) ---------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Stage 2: build ---------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Stage 3: runtime (prod dependencies only) ------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
# PORT=8080 matches Cloud Run's own default/injected value — set explicitly
# so `docker run` also works correctly without extra flags, not just Cloud Run.
ENV NODE_ENV=production \
    PORT=8080

RUN addgroup --system --gid 1001 backend \
  && adduser --system --uid 1001 backend

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder --chown=backend:backend /app/dist ./dist

USER backend

# Cloud Run injects $PORT (default 8080); src/config/env.ts's getPort()
# already checks BACKEND_PORT then PORT, so no code change was needed here.
EXPOSE 8080
CMD ["node", "dist/index.js"]
