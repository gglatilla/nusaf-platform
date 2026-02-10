-- CreateEnums (safe: IF NOT EXISTS not supported for CREATE TYPE, use DO block)
DO $$ BEGIN CREATE TYPE "CreditStatus" AS ENUM ('GOOD_STANDING', 'ON_HOLD', 'SUSPENDED', 'COD_ONLY'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "AccountStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'DORMANT', 'CHURNED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ShippingMethod" AS ENUM ('COLLECTION', 'NUSAF_DELIVERY', 'COURIER', 'FREIGHT'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ContactRole" AS ENUM ('BUYER', 'FINANCE', 'TECHNICAL', 'RECEIVING', 'DECISION_MAKER'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Companies: add columns from baselined migrations that may be missing
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "is_internal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "is_cash_account" BOOLEAN NOT NULL DEFAULT false;

-- Companies: new customer management fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "account_number" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "credit_limit" DECIMAL(12,2);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "credit_status" "CreditStatus" NOT NULL DEFAULT 'GOOD_STANDING';
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "discount_override" DECIMAL(5,2);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "statement_email" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "invoice_email" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "territory" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "default_shipping_method" "ShippingMethod";
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bbbee_level" INTEGER;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bbbee_expiry_date" TIMESTAMP(3);

-- Companies: unique + search index on account_number
CREATE UNIQUE INDEX IF NOT EXISTS "companies_account_number_key" ON "companies"("account_number");
CREATE INDEX IF NOT EXISTS "companies_account_number_idx" ON "companies"("account_number");

-- CompanyAddresses: suburb, label, delivery instructions, site contact
ALTER TABLE "company_addresses" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "company_addresses" ADD COLUMN IF NOT EXISTS "suburb" TEXT;
ALTER TABLE "company_addresses" ADD COLUMN IF NOT EXISTS "delivery_instructions" TEXT;
ALTER TABLE "company_addresses" ADD COLUMN IF NOT EXISTS "contact_name" TEXT;
ALTER TABLE "company_addresses" ADD COLUMN IF NOT EXISTS "contact_phone" TEXT;

-- CompanyContacts: job title, role, active flag
ALTER TABLE "company_contacts" ADD COLUMN IF NOT EXISTS "job_title" TEXT;
ALTER TABLE "company_contacts" ADD COLUMN IF NOT EXISTS "contact_role" "ContactRole";
ALTER TABLE "company_contacts" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- Generate account numbers for existing non-internal companies
DO $$
DECLARE
  r RECORD;
  counter INTEGER := 1;
BEGIN
  FOR r IN SELECT id FROM companies WHERE is_internal = false AND account_number IS NULL ORDER BY created_at ASC
  LOOP
    UPDATE companies SET account_number = 'NUS-' || LPAD(counter::TEXT, 4, '0') WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
END $$;
