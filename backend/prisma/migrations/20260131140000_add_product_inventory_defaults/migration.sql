-- Add inventory default columns to products table
-- These columns define product-level inventory settings that can be overridden per location

ALTER TABLE "products" ADD COLUMN "default_reorder_point" INTEGER;
ALTER TABLE "products" ADD COLUMN "default_reorder_qty" INTEGER;
ALTER TABLE "products" ADD COLUMN "default_min_stock" INTEGER;
ALTER TABLE "products" ADD COLUMN "default_max_stock" INTEGER;
ALTER TABLE "products" ADD COLUMN "lead_time_days" INTEGER;
