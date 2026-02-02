-- AlterTable: Add marketing and publishing fields to products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "marketing_title" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "marketing_description" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meta_title" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meta_description" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "specifications" JSONB;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_published" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);

-- AlterTable: Add is_exact to competitor_cross_references
ALTER TABLE "competitor_cross_references" ADD COLUMN IF NOT EXISTS "is_exact" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ProductDocumentType" AS ENUM ('DATASHEET', 'CATALOG', 'CAD_DRAWING', 'INSTALLATION_MANUAL', 'CERTIFICATE', 'MSDS', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_documents" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" "ProductDocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "alt_text" TEXT,
    "caption" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_documents_product_id_idx" ON "product_documents"("product_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_images_product_id_idx" ON "product_images"("product_id");

-- AddForeignKey (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_documents_product_id_fkey') THEN
    ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_images_product_id_fkey') THEN
    ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
