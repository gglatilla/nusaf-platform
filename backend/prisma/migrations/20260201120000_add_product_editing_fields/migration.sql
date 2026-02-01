-- Add ProductType enum and new product fields for editing
-- This migration is idempotent (safe to run multiple times)

-- Create ProductType enum if not exists
DO $$ BEGIN
    CREATE TYPE "ProductType" AS ENUM ('STOCK_ONLY', 'ASSEMBLY_REQUIRED', 'MADE_TO_ORDER', 'KIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add product_type column if not exists
DO $$ BEGIN
    ALTER TABLE "products" ADD COLUMN "product_type" "ProductType" NOT NULL DEFAULT 'STOCK_ONLY';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add assembly_lead_days column if not exists
DO $$ BEGIN
    ALTER TABLE "products" ADD COLUMN "assembly_lead_days" INTEGER;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add is_configurable column if not exists
DO $$ BEGIN
    ALTER TABLE "products" ADD COLUMN "is_configurable" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add long_description column if not exists
DO $$ BEGIN
    ALTER TABLE "products" ADD COLUMN "long_description" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add weight column if not exists
DO $$ BEGIN
    ALTER TABLE "products" ADD COLUMN "weight" DECIMAL(10,3);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add dimensions_json column if not exists
DO $$ BEGIN
    ALTER TABLE "products" ADD COLUMN "dimensions_json" JSONB;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add image_url column if not exists
DO $$ BEGIN
    ALTER TABLE "products" ADD COLUMN "image_url" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
