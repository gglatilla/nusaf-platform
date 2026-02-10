-- AlterTable
ALTER TABLE "companies" ADD COLUMN "is_internal" BOOLEAN NOT NULL DEFAULT false;

-- Set existing Nusaf company as internal
UPDATE "companies" SET "is_internal" = true WHERE "id" = 'nusaf-internal';
