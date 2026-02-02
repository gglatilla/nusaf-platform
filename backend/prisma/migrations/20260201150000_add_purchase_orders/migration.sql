-- ============================================
-- PURCHASE ORDER TABLES MIGRATION
-- ============================================

-- Clean up any partial state
DROP TABLE IF EXISTS purchase_order_lines CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS purchase_order_counter CASCADE;
DROP TYPE IF EXISTS "PurchaseOrderStatus" CASCADE;
DROP TYPE IF EXISTS "UserRole_new" CASCADE;

-- Add PURCHASER role using CREATE/DROP/RENAME pattern (transaction-safe)
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'MANAGER', 'SALES', 'PURCHASER', 'CUSTOMER');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER'::"UserRole_new";
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Create PurchaseOrderStatus enum
CREATE TYPE "PurchaseOrderStatus" AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'SENT',
    'ACKNOWLEDGED',
    'PARTIALLY_RECEIVED',
    'RECEIVED',
    'CLOSED',
    'CANCELLED'
);

-- Create PurchaseOrderCounter table
CREATE TABLE "purchase_order_counter" (
    "id" TEXT NOT NULL DEFAULT 'po_counter',
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "purchase_order_counter_pkey" PRIMARY KEY ("id")
);

-- Create PurchaseOrder table
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "delivery_location" "Warehouse" NOT NULL DEFAULT 'JHB',
    "expected_date" TIMESTAMP(3),
    "currency" "SupplierCurrency" NOT NULL DEFAULT 'EUR',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "source_order_id" TEXT,
    "internal_notes" TEXT,
    "supplier_notes" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejection_reason" TEXT,
    "sent_at" TIMESTAMP(3),
    "sent_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- Create PurchaseOrderLine table
CREATE TABLE "purchase_order_lines" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "product_description" TEXT NOT NULL,
    "quantity_ordered" INTEGER NOT NULL,
    "quantity_received" INTEGER NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(10,4) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,
    "sales_order_line_id" TEXT,
    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- Create unique index on po_number
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- Create indexes on purchase_orders
CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");
CREATE INDEX "purchase_orders_po_number_idx" ON "purchase_orders"("po_number");

-- Create index on purchase_order_lines
CREATE INDEX "purchase_order_lines_purchase_order_id_idx" ON "purchase_order_lines"("purchase_order_id");

-- Add foreign key constraints
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchase_order_id_fkey"
    FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
