-- CreateEnum
CREATE TYPE "PickingSlipStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETE');

-- CreateTable
CREATE TABLE "picking_slips" (
    "id" TEXT NOT NULL,
    "picking_slip_number" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "location" "Warehouse" NOT NULL,
    "status" "PickingSlipStatus" NOT NULL DEFAULT 'PENDING',
    "assigned_to" TEXT,
    "assigned_to_name" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "picking_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picking_slip_lines" (
    "id" TEXT NOT NULL,
    "picking_slip_id" TEXT NOT NULL,
    "order_line_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "product_description" TEXT NOT NULL,
    "quantity_to_pick" INTEGER NOT NULL,
    "quantity_picked" INTEGER NOT NULL DEFAULT 0,
    "picked_at" TIMESTAMP(3),
    "picked_by" TEXT,
    "bin_location" TEXT,

    CONSTRAINT "picking_slip_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picking_slip_counter" (
    "id" TEXT NOT NULL DEFAULT 'picking_slip_counter',
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "picking_slip_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "picking_slips_picking_slip_number_key" ON "picking_slips"("picking_slip_number");

-- CreateIndex
CREATE INDEX "picking_slips_company_id_idx" ON "picking_slips"("company_id");

-- CreateIndex
CREATE INDEX "picking_slips_order_id_idx" ON "picking_slips"("order_id");

-- CreateIndex
CREATE INDEX "picking_slips_location_status_idx" ON "picking_slips"("location", "status");

-- CreateIndex
CREATE INDEX "picking_slip_lines_picking_slip_id_idx" ON "picking_slip_lines"("picking_slip_id");

-- AddForeignKey
ALTER TABLE "picking_slip_lines" ADD CONSTRAINT "picking_slip_lines_picking_slip_id_fkey" FOREIGN KEY ("picking_slip_id") REFERENCES "picking_slips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
