-- UpdateEnum: Update UnitOfMeasure values
-- M -> MTR (Metre)
-- BOX -> BX
-- PAIR -> PR
-- ROLL -> ROL

-- Since there are no products in the database yet, we can safely replace the enum

-- Create new enum type
CREATE TYPE "UnitOfMeasure_new" AS ENUM ('EA', 'MTR', 'KG', 'SET', 'PR', 'ROL', 'BX');

-- Update the column to use the new type (with cast)
ALTER TABLE "products" ALTER COLUMN "unit_of_measure" DROP DEFAULT;
ALTER TABLE "products" ALTER COLUMN "unit_of_measure" TYPE "UnitOfMeasure_new" USING (
  CASE "unit_of_measure"::text
    WHEN 'M' THEN 'MTR'
    WHEN 'BOX' THEN 'BX'
    WHEN 'PAIR' THEN 'PR'
    WHEN 'ROLL' THEN 'ROL'
    ELSE "unit_of_measure"::text
  END
)::"UnitOfMeasure_new";
ALTER TABLE "products" ALTER COLUMN "unit_of_measure" SET DEFAULT 'EA'::"UnitOfMeasure_new";

-- Drop old enum and rename new one
DROP TYPE "UnitOfMeasure";
ALTER TYPE "UnitOfMeasure_new" RENAME TO "UnitOfMeasure";
