-- Phase 2D: Issue Flags and Document Archive

-- Issue Flag Enums
CREATE TYPE "IssueFlagCategory" AS ENUM ('STOCK', 'QUALITY', 'PRODUCTION', 'TIMING', 'DOCUMENTATION');
CREATE TYPE "IssueFlagSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "IssueFlagStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_INFO', 'RESOLVED', 'CLOSED');

-- Document Type Enum
CREATE TYPE "DocumentType" AS ENUM ('CUSTOMER_PO', 'SIGNED_DELIVERY_NOTE');

-- Issue Flags Table
CREATE TABLE "issue_flags" (
    "id" TEXT NOT NULL,
    "issue_number" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "picking_slip_id" TEXT,
    "job_card_id" TEXT,
    "category" "IssueFlagCategory" NOT NULL,
    "severity" "IssueFlagSeverity" NOT NULL,
    "status" "IssueFlagStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sla_deadline" TIMESTAMP(3) NOT NULL,
    "escalated_at" TIMESTAMP(3),
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_flags_pkey" PRIMARY KEY ("id")
);

-- Issue Comments Table
CREATE TABLE "issue_comments" (
    "id" TEXT NOT NULL,
    "issue_flag_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_comments_pkey" PRIMARY KEY ("id")
);

-- Issue Flag Counter Table
CREATE TABLE "issue_flag_counter" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "issue_flag_counter_pkey" PRIMARY KEY ("id")
);

-- Documents Table
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "r2_key" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retain_until" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "issue_flags_issue_number_key" ON "issue_flags"("issue_number");
CREATE UNIQUE INDEX "documents_r2_key_key" ON "documents"("r2_key");

-- Issue Flags Indexes
CREATE INDEX "issue_flags_company_id_idx" ON "issue_flags"("company_id");
CREATE INDEX "issue_flags_picking_slip_id_idx" ON "issue_flags"("picking_slip_id");
CREATE INDEX "issue_flags_job_card_id_idx" ON "issue_flags"("job_card_id");
CREATE INDEX "issue_flags_status_idx" ON "issue_flags"("status");
CREATE INDEX "issue_flags_severity_idx" ON "issue_flags"("severity");
CREATE INDEX "issue_flags_sla_deadline_idx" ON "issue_flags"("sla_deadline");

-- Issue Comments Index
CREATE INDEX "issue_comments_issue_flag_id_idx" ON "issue_comments"("issue_flag_id");

-- Documents Indexes
CREATE INDEX "documents_company_id_idx" ON "documents"("company_id");
CREATE INDEX "documents_order_id_idx" ON "documents"("order_id");
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- Foreign keys for Issue Flags
ALTER TABLE "issue_flags" ADD CONSTRAINT "issue_flags_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "issue_flags" ADD CONSTRAINT "issue_flags_picking_slip_id_fkey"
    FOREIGN KEY ("picking_slip_id") REFERENCES "picking_slips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "issue_flags" ADD CONSTRAINT "issue_flags_job_card_id_fkey"
    FOREIGN KEY ("job_card_id") REFERENCES "job_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "issue_flags" ADD CONSTRAINT "issue_flags_resolved_by_id_fkey"
    FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "issue_flags" ADD CONSTRAINT "issue_flags_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign keys for Issue Comments
ALTER TABLE "issue_comments" ADD CONSTRAINT "issue_comments_issue_flag_id_fkey"
    FOREIGN KEY ("issue_flag_id") REFERENCES "issue_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_comments" ADD CONSTRAINT "issue_comments_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign keys for Documents
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_fkey"
    FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
