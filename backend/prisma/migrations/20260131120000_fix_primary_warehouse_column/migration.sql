-- Fix primary_warehouse column issue
-- The correct column (primary_warehouse) already exists
-- We just need to drop the incorrect column (primary_warehouse_id) if it exists

-- Drop the incorrect _id columns if they exist
DO $$
BEGIN
    -- Drop primary_warehouse_id from users if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'primary_warehouse_id') THEN
        ALTER TABLE "users" DROP COLUMN "primary_warehouse_id";
    END IF;

    -- Drop primary_warehouse_id from companies if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'companies' AND column_name = 'primary_warehouse_id') THEN
        ALTER TABLE "companies" DROP COLUMN "primary_warehouse_id";
    END IF;
END $$;

-- Ensure primary_warehouse column exists with correct type (if somehow missing)
DO $$
BEGIN
    -- Create on users if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'primary_warehouse') THEN
        ALTER TABLE "users" ADD COLUMN "primary_warehouse" "Warehouse";
    END IF;

    -- Create on companies if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'companies' AND column_name = 'primary_warehouse') THEN
        ALTER TABLE "companies" ADD COLUMN "primary_warehouse" "Warehouse";
    END IF;
END $$;
