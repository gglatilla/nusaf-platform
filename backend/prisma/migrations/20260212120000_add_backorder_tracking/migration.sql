-- AlterTable
ALTER TABLE "sales_order_lines" ADD COLUMN "quantity_backorder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "purchase_order_lines_sales_order_line_id_idx" ON "purchase_order_lines"("sales_order_line_id");
