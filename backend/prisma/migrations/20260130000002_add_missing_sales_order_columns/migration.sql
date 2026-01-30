-- Add missing columns to sales_orders table
-- These columns exist in the Prisma schema but were missed in the initial migration

ALTER TABLE "sales_orders" ADD COLUMN "customer_notes" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "hold_reason" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "cancel_reason" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "confirmed_at" TIMESTAMP(3);
ALTER TABLE "sales_orders" ADD COLUMN "confirmed_by" TEXT;
