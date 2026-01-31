-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT', 'ISSUE', 'TRANSFER_OUT', 'TRANSFER_IN', 'MANUFACTURE_IN', 'MANUFACTURE_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'SCRAP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "StockAdjustmentReason" AS ENUM ('INITIAL_COUNT', 'CYCLE_COUNT', 'DAMAGED', 'EXPIRED', 'FOUND', 'LOST', 'DATA_CORRECTION', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "StockAdjustmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReservationType" AS ENUM ('SOFT', 'HARD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: stock_levels
CREATE TABLE "stock_levels" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "location" "Warehouse" NOT NULL,
    "on_hand" INTEGER NOT NULL DEFAULT 0,
    "soft_reserved" INTEGER NOT NULL DEFAULT 0,
    "hard_reserved" INTEGER NOT NULL DEFAULT 0,
    "on_order" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER,
    "reorder_quantity" INTEGER,
    "minimum_stock" INTEGER,
    "maximum_stock" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "stock_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable: stock_movements
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "location" "Warehouse" NOT NULL,
    "movement_type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "reference_number" TEXT,
    "adjustment_reason" "StockAdjustmentReason",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable: stock_adjustments
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "adjustment_number" TEXT NOT NULL,
    "location" "Warehouse" NOT NULL,
    "reason" "StockAdjustmentReason" NOT NULL,
    "notes" TEXT,
    "status" "StockAdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: stock_adjustment_lines
CREATE TABLE "stock_adjustment_lines" (
    "id" TEXT NOT NULL,
    "adjustment_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "product_description" TEXT NOT NULL,
    "current_quantity" INTEGER NOT NULL,
    "adjusted_quantity" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "stock_adjustment_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable: stock_adjustment_counter
CREATE TABLE "stock_adjustment_counter" (
    "id" TEXT NOT NULL DEFAULT 'stock_adjustment_counter',
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stock_adjustment_counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable: stock_reservations
CREATE TABLE "stock_reservations" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "location" "Warehouse" NOT NULL,
    "reservation_type" "ReservationType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "reference_number" TEXT,
    "expires_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "released_by" TEXT,
    "release_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes: stock_levels
CREATE INDEX "stock_levels_product_id_idx" ON "stock_levels"("product_id");
CREATE INDEX "stock_levels_location_idx" ON "stock_levels"("location");
CREATE UNIQUE INDEX "stock_levels_product_id_location_key" ON "stock_levels"("product_id", "location");

-- CreateIndexes: stock_movements
CREATE INDEX "stock_movements_product_id_location_idx" ON "stock_movements"("product_id", "location");
CREATE INDEX "stock_movements_movement_type_idx" ON "stock_movements"("movement_type");
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndexes: stock_adjustments
CREATE UNIQUE INDEX "stock_adjustments_adjustment_number_key" ON "stock_adjustments"("adjustment_number");
CREATE INDEX "stock_adjustments_status_idx" ON "stock_adjustments"("status");
CREATE INDEX "stock_adjustments_location_idx" ON "stock_adjustments"("location");

-- CreateIndexes: stock_adjustment_lines
CREATE INDEX "stock_adjustment_lines_adjustment_id_idx" ON "stock_adjustment_lines"("adjustment_id");

-- CreateIndexes: stock_reservations
CREATE INDEX "stock_reservations_product_id_location_idx" ON "stock_reservations"("product_id", "location");
CREATE INDEX "stock_reservations_reference_type_reference_id_idx" ON "stock_reservations"("reference_type", "reference_id");
CREATE INDEX "stock_reservations_reservation_type_idx" ON "stock_reservations"("reservation_type");
CREATE INDEX "stock_reservations_expires_at_idx" ON "stock_reservations"("expires_at");

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_adjustment_id_fkey" FOREIGN KEY ("adjustment_id") REFERENCES "stock_adjustments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
