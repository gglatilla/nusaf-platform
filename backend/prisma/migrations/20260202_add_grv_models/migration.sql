-- Add WAREHOUSE role to UserRole enum
ALTER TYPE "UserRole" ADD VALUE 'WAREHOUSE';

-- Create GRV Counter table
CREATE TABLE "grv_counter" (
    "id" TEXT NOT NULL DEFAULT 'grv_counter',
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "grv_counter_pkey" PRIMARY KEY ("id")
);

-- Create Goods Received Voucher table
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

-- Create GRV Lines table
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

-- Create unique index on grv_number
CREATE UNIQUE INDEX "goods_received_vouchers_grv_number_key" ON "goods_received_vouchers"("grv_number");

-- Create indexes on goods_received_vouchers
CREATE INDEX "goods_received_vouchers_purchase_order_id_idx" ON "goods_received_vouchers"("purchase_order_id");
CREATE INDEX "goods_received_vouchers_location_idx" ON "goods_received_vouchers"("location");
CREATE INDEX "goods_received_vouchers_received_at_idx" ON "goods_received_vouchers"("received_at");

-- Create indexes on grv_lines
CREATE INDEX "grv_lines_grv_id_idx" ON "grv_lines"("grv_id");
CREATE INDEX "grv_lines_po_line_id_idx" ON "grv_lines"("po_line_id");

-- Add foreign key constraints
ALTER TABLE "goods_received_vouchers" ADD CONSTRAINT "goods_received_vouchers_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "grv_lines" ADD CONSTRAINT "grv_lines_grv_id_fkey" FOREIGN KEY ("grv_id") REFERENCES "goods_received_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
