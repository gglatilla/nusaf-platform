-- Add missing indexes for FK relationships (performance optimization)

-- User -> Company
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CompanyAddress -> Company
CREATE INDEX "company_addresses_company_id_idx" ON "company_addresses"("company_id");

-- CompanyContact -> Company
CREATE INDEX "company_contacts_company_id_idx" ON "company_contacts"("company_id");

-- SubCategory -> Category
CREATE INDEX "sub_categories_category_id_idx" ON "sub_categories"("category_id");

-- Product -> SubCategory
CREATE INDEX "products_sub_category_id_idx" ON "products"("sub_category_id");

-- PricingRule -> SubCategory
CREATE INDEX "pricing_rules_sub_category_id_idx" ON "pricing_rules"("sub_category_id");
