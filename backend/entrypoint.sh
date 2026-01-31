#!/bin/sh
set -e

echo "[ENTRYPOINT] Starting Nusaf Backend..."
echo "[ENTRYPOINT] Node version: $(node --version)"
echo "[ENTRYPOINT] Working directory: $(pwd)"
echo "[ENTRYPOINT] Listing dist folder:"
ls -la dist/ || echo "[ENTRYPOINT] ERROR: dist folder not found!"

echo "[ENTRYPOINT] Running Prisma migrations..."
npx prisma migrate deploy || {
  echo "[ENTRYPOINT] ERROR: Prisma migration failed!"
  exit 1
}

echo "[ENTRYPOINT] Starting Node.js server..."
exec node dist/index.js
