-- Fix column name mismatch: primary_warehouse_id should be primary_warehouse
-- And type should be Warehouse enum, not TEXT

-- Rename columns from primary_warehouse_id to primary_warehouse
ALTER TABLE "users" RENAME COLUMN "primary_warehouse_id" TO "primary_warehouse";
ALTER TABLE "companies" RENAME COLUMN "primary_warehouse_id" TO "primary_warehouse";

-- Convert TEXT to Warehouse enum type
-- First, update any existing values to be valid enum values (or NULL)
UPDATE "users" SET "primary_warehouse" = NULL WHERE "primary_warehouse" IS NOT NULL AND "primary_warehouse" NOT IN ('JHB', 'CT');
UPDATE "companies" SET "primary_warehouse" = NULL WHERE "primary_warehouse" IS NOT NULL AND "primary_warehouse" NOT IN ('JHB', 'CT');

-- Then alter the column type to use the Warehouse enum
ALTER TABLE "users" ALTER COLUMN "primary_warehouse" TYPE "Warehouse" USING "primary_warehouse"::"Warehouse";
ALTER TABLE "companies" ALTER COLUMN "primary_warehouse" TYPE "Warehouse" USING "primary_warehouse"::"Warehouse";
