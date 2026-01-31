-- Fix column name mismatch: primary_warehouse_id should be primary_warehouse
-- And type should be Warehouse enum, not TEXT
-- This migration handles multiple scenarios safely

-- Handle users table
DO $$
BEGIN
    -- Case 1: Column exists as primary_warehouse_id (needs rename)
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'primary_warehouse_id') THEN
        ALTER TABLE "users" RENAME COLUMN "primary_warehouse_id" TO "primary_warehouse";
    END IF;

    -- Case 2: Column doesn't exist at all (needs creation)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'primary_warehouse') THEN
        ALTER TABLE "users" ADD COLUMN "primary_warehouse" "Warehouse";
    END IF;
END $$;

-- Handle companies table
DO $$
BEGIN
    -- Case 1: Column exists as primary_warehouse_id (needs rename)
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'companies' AND column_name = 'primary_warehouse_id') THEN
        ALTER TABLE "companies" RENAME COLUMN "primary_warehouse_id" TO "primary_warehouse";
    END IF;

    -- Case 2: Column doesn't exist at all (needs creation)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'companies' AND column_name = 'primary_warehouse') THEN
        ALTER TABLE "companies" ADD COLUMN "primary_warehouse" "Warehouse";
    END IF;
END $$;

-- Convert type if still TEXT (handles case where column was renamed but not converted)
DO $$
DECLARE
    col_type text;
BEGIN
    -- Check users.primary_warehouse type
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'primary_warehouse';

    IF col_type = 'text' THEN
        -- Clear invalid values first
        UPDATE "users" SET "primary_warehouse" = NULL
        WHERE "primary_warehouse" IS NOT NULL AND "primary_warehouse" NOT IN ('JHB', 'CT');
        -- Convert to enum
        ALTER TABLE "users" ALTER COLUMN "primary_warehouse" TYPE "Warehouse"
        USING "primary_warehouse"::"Warehouse";
    END IF;

    -- Check companies.primary_warehouse type
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'primary_warehouse';

    IF col_type = 'text' THEN
        -- Clear invalid values first
        UPDATE "companies" SET "primary_warehouse" = NULL
        WHERE "primary_warehouse" IS NOT NULL AND "primary_warehouse" NOT IN ('JHB', 'CT');
        -- Convert to enum
        ALTER TABLE "companies" ALTER COLUMN "primary_warehouse" TYPE "Warehouse"
        USING "primary_warehouse"::"Warehouse";
    END IF;
END $$;
