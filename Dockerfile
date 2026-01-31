# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-slim AS builder

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
# This creates proper workspace links because shared is present
RUN npm ci --omit=dev --ignore-scripts

# Regenerate Prisma client for production
WORKDIR /app/backend
RUN npx prisma generate

EXPOSE 3001

# Start command - run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
