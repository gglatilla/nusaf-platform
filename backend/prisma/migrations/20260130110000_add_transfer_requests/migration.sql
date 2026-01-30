-- CreateEnum
CREATE TYPE "TransferRequestStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'RECEIVED');

-- CreateTable
CREATE TABLE "transfer_requests" (
    "id" TEXT NOT NULL,
    "transfer_number" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "order_id" TEXT,
    "order_number" TEXT,
    "from_location" "Warehouse" NOT NULL DEFAULT 'JHB',
    "to_location" "Warehouse" NOT NULL DEFAULT 'CT',
    "status" "TransferRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "shipped_at" TIMESTAMP(3),
    "shipped_by" TEXT,
    "shipped_by_name" TEXT,
    "received_at" TIMESTAMP(3),
    "received_by" TEXT,
    "received_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_request_lines" (
    "id" TEXT NOT NULL,
    "transfer_request_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "product_description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "received_quantity" INTEGER NOT NULL DEFAULT 0,
    "order_line_id" TEXT,

    CONSTRAINT "transfer_request_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_request_counter" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "transfer_request_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transfer_requests_transfer_number_key" ON "transfer_requests"("transfer_number");

-- CreateIndex
CREATE INDEX "transfer_requests_company_id_idx" ON "transfer_requests"("company_id");

-- CreateIndex
CREATE INDEX "transfer_requests_order_id_idx" ON "transfer_requests"("order_id");

-- CreateIndex
CREATE INDEX "transfer_requests_status_idx" ON "transfer_requests"("status");

-- CreateIndex
CREATE INDEX "transfer_request_lines_transfer_request_id_idx" ON "transfer_request_lines"("transfer_request_id");

-- AddForeignKey
ALTER TABLE "transfer_request_lines" ADD CONSTRAINT "transfer_request_lines_transfer_request_id_fkey" FOREIGN KEY ("transfer_request_id") REFERENCES "transfer_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
