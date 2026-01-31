# Custom Dockerfile for Railway deployment
# Builds the Nusaf Platform backend with workspace support

FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies (use install, not ci, to handle workspaces better)
RUN npm install --omit=dev || npm install

# Copy source files
COPY shared ./shared
COPY backend ./backend

# Build shared package
RUN npm run build -w shared

# Generate Prisma client and build backend
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# Expose port
EXPOSE 3001

# Start command - run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
