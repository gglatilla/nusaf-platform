# Current Session

## Active Task
[TASK-012] Phase 2D: Issue Flagging and Document Archive

## Status
COMPLETE | 100%

## Plan
Two interconnected systems implemented:
1. **Issue Flagging** - Track and resolve problems on Picking Slips and Job Cards
2. **Document Archive** - Store and retrieve order-related documents in Cloudflare R2

## Micro-tasks Completed

### Issue Flagging (10 tasks)
- [x] 1. Add IssueFlagCategory, IssueFlagSeverity, IssueFlagStatus enums and IssueFlag, IssueComment, IssueFlagCounter models to schema.prisma
- [x] 2. Create migration file `20260130140000_add_issue_flags_and_documents`
- [x] 3. Create `issue-flag.service.ts` with generateNumber, create, list, get, getForPickingSlip, getForJobCard, getStats functions
- [x] 4. Add updateStatus, addComment, resolve, close functions
- [x] 5. Create `validation/issue-flags.ts` Zod schemas
- [x] 6. Create `api/v1/issues/route.ts` endpoints + register in index.ts
- [x] 7. Add IssueFlag types and API methods to `lib/api.ts`
- [x] 8. Create `useIssueFlags.ts` hooks
- [x] 9. Create IssueFlagStatusBadge, SeverityBadge, CategoryBadge components
- [x] 10. Create IssueListTable, IssueCommentThread, CreateIssueFlagModal components
- [x] 11. Create `/issues` list page
- [x] 12. Create `/issues/[id]` detail page
- [x] 13. Add "Flag Issue" button and issues section to Picking Slip detail
- [x] 14. Add "Flag Issue" button and issues section to Job Card detail
- [x] 15. Create DashboardIssuesWidget and add to dashboard
- [x] 16. Add Issues to navigation

### Document Archive (7 tasks)
- [x] 17. Add DocumentType enum and Document model to schema.prisma
- [x] 18. Migration included in `20260130140000_add_issue_flags_and_documents`
- [x] 19. Create `document.service.ts` with upload, list, getForOrder, getDownloadUrl, delete functions
- [x] 20. Create `validation/documents.ts` and `api/v1/documents/route.ts`
- [x] 21. Add Document types and API methods to `lib/api.ts`
- [x] 22. Create `useDocuments.ts` hooks
- [x] 23. Create DocumentTypeLabel, DocumentUploadButton, DocumentList, OrderDocumentsSection components
- [x] 24. Add Documents section to Order detail page

## Files Created

### Backend
- `backend/prisma/migrations/20260130140000_add_issue_flags_and_documents/migration.sql`
- `backend/src/services/issue-flag.service.ts`
- `backend/src/services/document.service.ts`
- `backend/src/utils/validation/issue-flags.ts`
- `backend/src/utils/validation/documents.ts`
- `backend/src/api/v1/issues/route.ts`
- `backend/src/api/v1/documents/route.ts`

### Frontend
- `frontend/src/hooks/useIssueFlags.ts`
- `frontend/src/hooks/useDocuments.ts`
- `frontend/src/components/issues/IssueFlagStatusBadge.tsx`
- `frontend/src/components/issues/IssueFlagSeverityBadge.tsx`
- `frontend/src/components/issues/IssueFlagCategoryBadge.tsx`
- `frontend/src/components/issues/IssueListTable.tsx`
- `frontend/src/components/issues/IssueCommentThread.tsx`
- `frontend/src/components/issues/CreateIssueFlagModal.tsx`
- `frontend/src/components/issues/DashboardIssuesWidget.tsx`
- `frontend/src/components/documents/DocumentTypeLabel.tsx`
- `frontend/src/components/documents/DocumentUploadButton.tsx`
- `frontend/src/components/documents/DocumentList.tsx`
- `frontend/src/components/documents/OrderDocumentsSection.tsx`
- `frontend/src/components/documents/index.ts`
- `frontend/src/app/(portal)/issues/page.tsx`
- `frontend/src/app/(portal)/issues/[id]/page.tsx`

## Files Modified
- `backend/prisma/schema.prisma` - Added Issue Flag and Document models with enums
- `backend/src/index.ts` - Registered issues and documents routes
- `frontend/src/lib/api.ts` - Added Issue Flag and Document types and API methods
- `frontend/src/lib/navigation.ts` - Added Issues to sidebar navigation
- `frontend/src/app/(portal)/picking-slips/[id]/page.tsx` - Added Flag Issue button and issues section
- `frontend/src/app/(portal)/job-cards/[id]/page.tsx` - Added Flag Issue button and issues section
- `frontend/src/app/(portal)/orders/[id]/page.tsx` - Added Documents section
- `frontend/src/app/(portal)/dashboard/page.tsx` - Added DashboardIssuesWidget

## Skills Read
- domain/order-fulfillment-operations
- foundation/api-design-patterns
- foundation/database-design-b2b
- domain/ui-ux-webapp

## Business Rules Implemented

### Issue Flagging
- Categories: STOCK, QUALITY, PRODUCTION, TIMING, DOCUMENTATION
- Severities with SLA targets:
  - CRITICAL: 4 hours
  - HIGH: 24 hours
  - MEDIUM: 72 hours
  - LOW: 1 week
- Status workflow: OPEN → IN_PROGRESS → PENDING_INFO → RESOLVED → CLOSED
- Issue number format: ISS-YYYY-NNNNN
- Issues can be linked to PickingSlip OR JobCard (polymorphic)
- Comments support for collaboration
- Dashboard widget shows open issues by severity

### Document Archive
- Document types: CUSTOMER_PO, SIGNED_DELIVERY_NOTE
- Storage: Cloudflare R2 (existing service)
- Signed URLs for download with 1-hour expiry
- Retention: 7 years (SA Tax Act compliance)
- Path format: documents/{companyId}/{orderId}/{type}/{timestamp}_{filename}
- Max file size: 10MB
- Allowed types: PDF, JPEG, PNG, WebP

## Verification Steps

### Issue Flagging
1. Navigate to a Picking Slip detail page
2. Click "Flag Issue" button
3. Create issue with category=STOCK, severity=HIGH
4. Verify SLA deadline is set (24 hours from now)
5. Navigate to /issues to see the list
6. Open issue detail, add a comment
7. Change status to IN_PROGRESS
8. Resolve with resolution text
9. Close the issue
10. Check dashboard widget shows correct counts

### Document Archive
1. Navigate to an Order detail page
2. Click Upload Document button in sidebar
3. Select document type and file
4. Verify file appears in documents list
5. Click download, verify signed URL works
6. Verify retention date is 7 years from upload

## Next Task
Ready for:
- [TASK-013] Inventory tracking
- Any additional enhancements to issue/document workflows
