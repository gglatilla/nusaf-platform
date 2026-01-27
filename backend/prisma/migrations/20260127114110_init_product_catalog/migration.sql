-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'SALES', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "CustomerTier" AS ENUM ('END_USER', 'OEM_RESELLER', 'DISTRIBUTOR');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING');

-- CreateEnum
CREATE TYPE "SupplierCurrency" AS ENUM ('EUR', 'ZAR');

-- CreateEnum
CREATE TYPE "SkuHandling" AS ENUM ('DIRECT', 'TECOM_CONVERSION', 'NUSAF_INTERNAL');

-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('EA', 'M', 'KG', 'BOX', 'SET', 'PAIR', 'ROLL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trading_name" TEXT,
    "registration_number" TEXT,
    "vat_number" TEXT,
    "tier" "CustomerTier" NOT NULL DEFAULT 'END_USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_addresses" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "type" "AddressType" NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'South Africa',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_contacts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "mobile" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Italy',
    "currency" "SupplierCurrency" NOT NULL DEFAULT 'EUR',
    "sku_handling" "SkuHandling" NOT NULL,
    "is_local" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "supplier_sku" TEXT NOT NULL,
    "nusaf_sku" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit_of_measure" "UnitOfMeasure" NOT NULL DEFAULT 'EA',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "supplier_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sub_category_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_cross_references" (
    "id" TEXT NOT NULL,
    "competitor_brand" TEXT NOT NULL,
    "competitor_sku" TEXT NOT NULL,
    "notes" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "competitor_cross_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku_mappings" (
    "id" TEXT NOT NULL,
    "supplier_sku" TEXT NOT NULL,
    "nusaf_sku" TEXT NOT NULL,
    "is_override" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "supplier_id" TEXT NOT NULL,
    "override_category_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "sku_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_category_id_code_key" ON "sub_categories"("category_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "products_nusaf_sku_key" ON "products"("nusaf_sku");

-- CreateIndex
CREATE INDEX "products_supplier_id_idx" ON "products"("supplier_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_nusaf_sku_idx" ON "products"("nusaf_sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_supplier_id_supplier_sku_key" ON "products"("supplier_id", "supplier_sku");

-- CreateIndex
CREATE INDEX "competitor_cross_references_product_id_idx" ON "competitor_cross_references"("product_id");

-- CreateIndex
CREATE INDEX "competitor_cross_references_competitor_sku_idx" ON "competitor_cross_references"("competitor_sku");

-- CreateIndex
CREATE UNIQUE INDEX "competitor_cross_references_competitor_brand_competitor_sku_key" ON "competitor_cross_references"("competitor_brand", "competitor_sku");

-- CreateIndex
CREATE INDEX "sku_mappings_supplier_sku_idx" ON "sku_mappings"("supplier_sku");

-- CreateIndex
CREATE INDEX "sku_mappings_nusaf_sku_idx" ON "sku_mappings"("nusaf_sku");

-- CreateIndex
CREATE UNIQUE INDEX "sku_mappings_supplier_id_supplier_sku_key" ON "sku_mappings"("supplier_id", "supplier_sku");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_addresses" ADD CONSTRAINT "company_addresses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_cross_references" ADD CONSTRAINT "competitor_cross_references_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku_mappings" ADD CONSTRAINT "sku_mappings_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
