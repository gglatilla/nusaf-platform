-- Add isCashAccount flag to companies
ALTER TABLE "companies" ADD COLUMN "is_cash_account" BOOLEAN NOT NULL DEFAULT false;

-- Add cash customer fields to quotes
ALTER TABLE "quotes" ADD COLUMN "cash_customer_name" VARCHAR(200);
ALTER TABLE "quotes" ADD COLUMN "cash_customer_phone" VARCHAR(30);
ALTER TABLE "quotes" ADD COLUMN "cash_customer_email" VARCHAR(254);
ALTER TABLE "quotes" ADD COLUMN "cash_customer_company" VARCHAR(200);
ALTER TABLE "quotes" ADD COLUMN "cash_customer_vat" VARCHAR(20);
ALTER TABLE "quotes" ADD COLUMN "cash_customer_address" VARCHAR(500);

-- Add cash customer fields to sales_orders
ALTER TABLE "sales_orders" ADD COLUMN "cash_customer_name" VARCHAR(200);
ALTER TABLE "sales_orders" ADD COLUMN "cash_customer_phone" VARCHAR(30);
ALTER TABLE "sales_orders" ADD COLUMN "cash_customer_email" VARCHAR(254);
ALTER TABLE "sales_orders" ADD COLUMN "cash_customer_company" VARCHAR(200);
ALTER TABLE "sales_orders" ADD COLUMN "cash_customer_vat" VARCHAR(20);
ALTER TABLE "sales_orders" ADD COLUMN "cash_customer_address" VARCHAR(500);

-- Insert cash sales companies
INSERT INTO "companies" ("id", "name", "trading_name", "tier", "is_active", "is_internal", "is_cash_account", "primary_warehouse", "payment_terms", "fulfillment_policy", "created_at", "updated_at")
VALUES
  ('cash-sales-jhb', 'Cash Sales - Johannesburg', 'Cash Sales JHB', 'END_USER', true, false, true, 'JHB', 'COD', 'SHIP_COMPLETE', NOW(), NOW()),
  ('cash-sales-ct', 'Cash Sales - Cape Town', 'Cash Sales CT', 'END_USER', true, false, true, 'CT', 'COD', 'SHIP_COMPLETE', NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET "is_cash_account" = true, "updated_at" = NOW();
