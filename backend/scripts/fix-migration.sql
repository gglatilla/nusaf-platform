-- Cleanup script: Remove failed migration record and partial state
-- This runs BEFORE prisma migrate deploy

-- Delete the failed migration record so Prisma doesn't block
DELETE FROM _prisma_migrations WHERE migration_name = '20260202_add_grv_models';

-- Drop any partial objects from failed attempts
DROP TABLE IF EXISTS grv_lines CASCADE;
DROP TABLE IF EXISTS goods_received_vouchers CASCADE;
DROP TABLE IF EXISTS grv_counter CASCADE;
DROP TYPE IF EXISTS "UserRole_new" CASCADE;

-- Remove WAREHOUSE from UserRole if it was partially added
DELETE FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
AND enumlabel = 'WAREHOUSE';
