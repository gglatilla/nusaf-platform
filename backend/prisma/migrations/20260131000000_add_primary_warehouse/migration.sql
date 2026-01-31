-- AlterTable: Add primary_warehouse to users table
ALTER TABLE "users" ADD COLUMN "primary_warehouse" "Warehouse";

-- AlterTable: Add primary_warehouse to companies table
ALTER TABLE "companies" ADD COLUMN "primary_warehouse" "Warehouse";
