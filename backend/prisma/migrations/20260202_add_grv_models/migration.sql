-- ============================================
-- IDEMPOTENT MIGRATION: GRV Models + WAREHOUSE Role
-- ============================================

-- Clean up any partial state from previous failed attempts
DROP TABLE IF EXISTS grv_lines CASCADE;
DROP TABLE IF EXISTS goods_received_vouchers CASCADE;
DROP TABLE IF EXISTS grv_counter CASCADE;
DROP TYPE IF EXISTS "UserRole_new" CASCADE;

-- Step 1: Create new UserRole enum with WAREHOUSE value
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'MANAGER', 'SALES', 'PURCHASER', 'WAREHOUSE', 'CUSTOMER');

-- Step 2: Migrate users table to new enum
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER'::"UserRole_new";

-- Step 3: Drop old enum and rename new one
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Step 4: Create GRV Counter table
CREATE TABLE "grv_counter" (
    "id" TEXT NOT NULL DEFAULT 'grv_counter',
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "grv_counter_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create Goods Received Voucher table
CREATE TABLE "goods_received_vouchers" (
    "id" TEXT NOT NULL,
    "grv_number" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "location" "Warehouse" NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_by" TEXT NOT NULL,
    "received_by_name" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "goods_received_vouchers_pkey" PRIMARY KEY ("id")
);

-- Step 6: Create GRV Lines table
CREATE TABLE "grv_lines" (
    "id" TEXT NOT NULL,
    "grv_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "po_line_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "quantity_expected" INTEGER NOT NULL,
    "quantity_received" INTEGER NOT NULL,
    "quantity_rejected" INTEGER NOT NULL DEFAULT 0,
    "rejection_reason" TEXT,
    CONSTRAINT "grv_lines_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create indexes
CREATE UNIQUE INDEX "goods_received_vouchers_grv_number_key" ON "goods_received_vouchers"("grv_number");
CREATE INDEX "goods_received_vouchers_purchase_order_id_idx" ON "goods_received_vouchers"("purchase_order_id");
CREATE INDEX "goods_received_vouchers_location_idx" ON "goods_received_vouchers"("location");
CREATE INDEX "goods_received_vouchers_received_at_idx" ON "goods_received_vouchers"("received_at");
CREATE INDEX "grv_lines_grv_id_idx" ON "grv_lines"("grv_id");
CREATE INDEX "grv_lines_po_line_id_idx" ON "grv_lines"("po_line_id");

-- Step 8: Add foreign key constraints
ALTER TABLE "goods_received_vouchers" ADD CONSTRAINT "goods_received_vouchers_purchase_order_id_fkey"
    FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grv_lines" ADD CONSTRAINT "grv_lines_grv_id_fkey"
    FOREIGN KEY ("grv_id") REFERENCES "goods_received_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
