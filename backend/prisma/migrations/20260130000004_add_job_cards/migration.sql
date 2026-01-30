-- CreateEnum
CREATE TYPE "JobCardStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETE');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('MACHINING', 'ASSEMBLY');

-- CreateTable
CREATE TABLE "job_cards" (
    "id" TEXT NOT NULL,
    "job_card_number" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "order_line_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "product_description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "job_type" "JobType" NOT NULL,
    "status" "JobCardStatus" NOT NULL DEFAULT 'PENDING',
    "hold_reason" TEXT,
    "notes" TEXT,
    "assigned_to" TEXT,
    "assigned_to_name" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_card_counter" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "job_card_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_cards_job_card_number_key" ON "job_cards"("job_card_number");

-- CreateIndex
CREATE INDEX "job_cards_company_id_idx" ON "job_cards"("company_id");

-- CreateIndex
CREATE INDEX "job_cards_order_id_idx" ON "job_cards"("order_id");

-- CreateIndex
CREATE INDEX "job_cards_status_idx" ON "job_cards"("status");
