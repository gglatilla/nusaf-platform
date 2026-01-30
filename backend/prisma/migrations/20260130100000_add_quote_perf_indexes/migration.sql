-- Performance indexes for products and quotes

-- Product: filter active products efficiently
CREATE INDEX IF NOT EXISTS "products_is_active_deleted_at_idx" ON "products"("is_active", "deleted_at");

-- Quote: draft quote lookup by user
CREATE INDEX IF NOT EXISTS "quotes_user_id_status_deleted_at_idx" ON "quotes"("user_id", "status", "deleted_at");

-- QuoteItem: duplicate product check
CREATE INDEX IF NOT EXISTS "quote_items_quote_id_product_id_idx" ON "quote_items"("quote_id", "product_id");
