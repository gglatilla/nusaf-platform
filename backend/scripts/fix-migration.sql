-- Cleanup script: Remove failed migration records and partial state
-- This runs BEFORE prisma migrate deploy

-- Delete any failed migration records so Prisma doesn't block
DELETE FROM _prisma_migrations WHERE migration_name = '20260202_add_grv_models';
DELETE FROM _prisma_migrations WHERE migration_name = '20260201150000_add_purchase_orders';

-- Drop any partial GRV objects from failed attempts
DROP TABLE IF EXISTS grv_lines CASCADE;
DROP TABLE IF EXISTS goods_received_vouchers CASCADE;
DROP TABLE IF EXISTS grv_counter CASCADE;
DROP TYPE IF EXISTS "UserRole_new" CASCADE;

-- Drop any partial PurchaseOrder objects from failed attempts
DROP TABLE IF EXISTS purchase_order_lines CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS purchase_order_counter CASCADE;
DROP TYPE IF EXISTS "PurchaseOrderStatus" CASCADE;

-- Remove WAREHOUSE from UserRole if it was partially added
DELETE FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
AND enumlabel = 'WAREHOUSE';

-- Remove PURCHASER from UserRole if it was partially added
DELETE FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
AND enumlabel = 'PURCHASER';
