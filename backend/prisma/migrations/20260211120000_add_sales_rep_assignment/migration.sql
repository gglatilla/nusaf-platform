-- Add employee_code to users (for sales rep identification by code)
ALTER TABLE "users" ADD COLUMN "employee_code" TEXT;

-- Create unique index on employee_code (nullable, only unique when set)
CREATE UNIQUE INDEX "users_employee_code_key" ON "users"("employee_code");

-- Add assigned_sales_rep_id to companies
ALTER TABLE "companies" ADD COLUMN "assigned_sales_rep_id" TEXT;

-- Create index on assigned_sales_rep_id
CREATE INDEX "companies_assigned_sales_rep_id_idx" ON "companies"("assigned_sales_rep_id");

-- Add foreign key constraint
ALTER TABLE "companies" ADD CONSTRAINT "companies_assigned_sales_rep_id_fkey" FOREIGN KEY ("assigned_sales_rep_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
