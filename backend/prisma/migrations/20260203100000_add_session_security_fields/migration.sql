-- Add security fields to sessions table for refresh token rotation
-- P0-3: Implement proper token rotation with revocation tracking

-- Add token version for tracking refresh token generations
-- Incremented on each successful token refresh
ALTER TABLE "sessions" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 1;

-- Add revocation tracking
-- Set when session is explicitly revoked (not just deleted)
ALTER TABLE "sessions" ADD COLUMN "revoked_at" TIMESTAMP(3);

-- Add revocation reason for audit purposes
ALTER TABLE "sessions" ADD COLUMN "revoked_reason" TEXT;

-- Add index on revoked_at for finding active sessions
CREATE INDEX "sessions_revoked_at_idx" ON "sessions"("revoked_at");
