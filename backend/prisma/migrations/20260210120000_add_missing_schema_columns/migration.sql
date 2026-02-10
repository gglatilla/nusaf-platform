-- CreateEnum
CREATE TYPE "CreditNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'VOIDED');

-- AlterEnum
ALTER TYPE "JobCardStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
ALTER TYPE "PickingSlipStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
ALTER TYPE "TransferRequestStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "job_cards" ADD COLUMN     "material_check_performed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "material_check_result" JSONB;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "closed_by" TEXT;

-- CreateTable
CREATE TABLE "job_card_bom_lines" (
    "id" TEXT NOT NULL,
    "job_card_id" TEXT NOT NULL,
    "component_product_id" TEXT NOT NULL,
    "component_sku" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "quantity_per_unit" DECIMAL(12,4) NOT NULL,
    "total_required" DECIMAL(12,4) NOT NULL,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "job_card_bom_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" TEXT NOT NULL,
    "credit_note_number" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "order_id" TEXT,
    "order_number" TEXT,
    "return_authorization_id" TEXT NOT NULL,
    "ra_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_vat_number" TEXT,
    "customer_reg_number" TEXT,
    "billing_address" TEXT,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "issue_date" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_rate" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "vat_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pdf_url" TEXT,
    "voided_at" TIMESTAMP(3),
    "voided_by" TEXT,
    "void_reason" TEXT,
    "notes" TEXT,
    "issued_by" TEXT NOT NULL,
    "issued_by_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_note_lines" (
    "id" TEXT NOT NULL,
    "credit_note_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "return_authorization_line_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "product_description" TEXT NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,
    "resolution" TEXT,

    CONSTRAINT "credit_note_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_note_counter" (
    "id" TEXT NOT NULL DEFAULT 'cn_counter',
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "credit_note_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_card_bom_lines_job_card_id_idx" ON "job_card_bom_lines"("job_card_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_credit_note_number_key" ON "credit_notes"("credit_note_number");

-- CreateIndex
CREATE INDEX "credit_notes_company_id_idx" ON "credit_notes"("company_id");

-- CreateIndex
CREATE INDEX "credit_notes_order_id_idx" ON "credit_notes"("order_id");

-- CreateIndex
CREATE INDEX "credit_notes_return_authorization_id_idx" ON "credit_notes"("return_authorization_id");

-- CreateIndex
CREATE INDEX "credit_notes_status_idx" ON "credit_notes"("status");

-- CreateIndex
CREATE INDEX "credit_note_lines_credit_note_id_idx" ON "credit_note_lines"("credit_note_id");

-- AddForeignKey
ALTER TABLE "job_card_bom_lines" ADD CONSTRAINT "job_card_bom_lines_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "job_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note_lines" ADD CONSTRAINT "credit_note_lines_credit_note_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "credit_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
