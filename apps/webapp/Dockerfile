FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

# Set working directory to monorepo root
WORKDIR /app

# Copy package files for dependency installation
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/webapp/package.json ./apps/webapp/
COPY packages/database/package.json ./packages/database/
COPY packages/auth/package.json ./packages/auth/
COPY packages/pricing/package.json ./packages/pricing/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm --filter=@nusaf/database db:generate

# Build the webapp
RUN pnpm build --filter=@nusaf/webapp

# Expose port
EXPOSE 3001

# Start the webapp
CMD ["pnpm", "--filter=@nusaf/webapp", "start"]
