-- P2-5: Add missing performance indexes for audit queries

-- Index for stock_movements.created_by (audit queries)
CREATE INDEX "stock_movements_created_by_idx" ON "stock_movements"("created_by");

-- Index for stock_reservations.created_by (audit queries)
CREATE INDEX "stock_reservations_created_by_idx" ON "stock_reservations"("created_by");

-- Index for issue_flags.created_at (date range queries)
CREATE INDEX "issue_flags_created_at_idx" ON "issue_flags"("created_at");
