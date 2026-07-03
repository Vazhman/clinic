# Production image for the Khozrevanidze Clinic Next.js + Payload app.
#
# Single-stage Debian-slim because:
#   - Payload pulls in `sharp` and other native modules that have working
#     prebuilt binaries on glibc (Debian) but flake on Alpine/musl.
#   - We run `next build` inside the image so we don't ship build tools to
#     the runtime — but the image stays one stage to keep the Dockerfile
#     short and the build cache predictable for iterative changes. Image
#     size isn't a concern for local demo.
#
# Env vars required at BUILD time (passed via docker-compose `args:`):
#   PAYLOAD_SECRET        — Payload boot config
#   DATABASE_URL          — Payload's postgres adapter validates the URL
#                           shape at boot, doesn't need to actually reach DB
#   BLOB_READ_WRITE_TOKEN — read by the storage-vercel-blob plugin
#
# Env vars at RUN time (passed via docker-compose env_file + environment):
#   DATABASE_URL          — overridden to `postgres:5432` (docker service)
#   BLOB_READ_WRITE_TOKEN — same as build time
#   PAYLOAD_SECRET        — same as build time
#   TOTP_DISABLED=true    — kills the TOTP plugin path (importMap mismatch)

FROM node:24-bookworm-slim

WORKDIR /app

# Only the bare runtime needs: openssl + ca-certificates for HTTPS to Vercel
# Blob / Neon, curl for the healthcheck. Sharp ships prebuilt binaries for
# Node 24 on Debian, so we skip libvips-dev (190MB of apt junk we were
# pulling needlessly).
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

# Install npm deps first so a code-only edit doesn't bust the deps layer.
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# Copy the rest of the project. .dockerignore excludes node_modules and other
# noise so the COPY is fast.
COPY . .

# Build args become env for `next build` so Payload's plugin chain initialises.
ARG DATABASE_URL
ARG PAYLOAD_SECRET
ARG BLOB_READ_WRITE_TOKEN
ARG TOTP_DISABLED=true
ENV DATABASE_URL=${DATABASE_URL}
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
ENV BLOB_READ_WRITE_TOKEN=${BLOB_READ_WRITE_TOKEN}
ENV TOTP_DISABLED=${TOTP_DISABLED}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

EXPOSE 3000

# `next start` reads .next/ + public/ + serves on $PORT (default 3000).
CMD ["npm", "start"]
