# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-slim AS builder

# Cache bust - change this value to force rebuild of BOTH stages
ARG CACHE_BUST=v5
RUN echo "Builder cache bust: $CACHE_BUST"

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files for caching
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install ALL dependencies (devDeps needed for build)
RUN npm ci --ignore-scripts

# Copy source files
COPY shared ./shared
COPY backend ./backend

# Build shared package
RUN npm run build -w shared

# Build backend
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-slim AS production

# Cache bust - MUST match builder to force production stage rebuild
ARG CACHE_BUST=v5
RUN echo "Production cache bust: $CACHE_BUST"

# Install OpenSSL for Prisma runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files (needed for workspace resolution)
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Copy built shared package (actual files, not symlink!)
COPY --from=builder /app/shared/dist ./shared/dist

# Copy built backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Regenerate Prisma client for production
WORKDIR /app/backend
RUN npx prisma generate

# Copy entrypoint script
COPY backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3001

# Use entrypoint for better debugging output
ENTRYPOINT ["./entrypoint.sh"]
