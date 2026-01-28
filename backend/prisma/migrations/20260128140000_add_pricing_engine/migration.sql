-- Add pricing fields to products table
ALTER TABLE "products" ADD COLUMN "cost_price" DECIMAL(10,4);
ALTER TABLE "products" ADD COLUMN "list_price" DECIMAL(10,2);
ALTER TABLE "products" ADD COLUMN "price_updated_at" TIMESTAMP(3);

-- Create global_settings table
CREATE TABLE "global_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "eur_zar_rate" DECIMAL(10,4) NOT NULL,
    "rate_updated_at" TIMESTAMP(3) NOT NULL,
    "rate_updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- Create pricing_rules table
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sub_category_id" TEXT,
    "is_gross" BOOLEAN NOT NULL DEFAULT false,
    "discount_percent" DECIMAL(5,2),
    "freight_percent" DECIMAL(5,2) NOT NULL,
    "margin_divisor" DECIMAL(5,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX "pricing_rules_supplier_id_idx" ON "pricing_rules"("supplier_id");
CREATE INDEX "pricing_rules_category_id_idx" ON "pricing_rules"("category_id");

-- Add unique constraint (handles null sub_category_id with COALESCE)
CREATE UNIQUE INDEX "pricing_rules_supplier_id_category_id_sub_category_id_key" ON "pricing_rules"("supplier_id", "category_id", COALESCE("sub_category_id", ''));

-- Add foreign keys
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default EUR/ZAR rate
INSERT INTO "global_settings" ("id", "eur_zar_rate", "rate_updated_at", "updated_at")
VALUES ('global', 20.5000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
