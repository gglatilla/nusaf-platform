-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN "shipping_address_id" TEXT,
ADD COLUMN "shipping_address_snapshot" JSONB;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "company_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "sales_orders_shipping_address_id_idx" ON "sales_orders"("shipping_address_id");
