import { Prisma, IssueFlagCategory, IssueFlagSeverity, IssueFlagStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { generateIssueNumber } from '../utils/number-generation';
import { notifyIssueFlagged } from './notification.service';

/**
 * SLA deadlines by severity (in hours)
 */
export const SLA_HOURS: Record<IssueFlagSeverity, number> = {
  CRITICAL: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168, // 1 week
};

/**
 * Valid status transitions for issue flags
 */
export const ISSUE_STATUS_TRANSITIONS: Record<IssueFlagStatus, IssueFlagStatus[]> = {
  OPEN: ['IN_PROGRESS', 'PENDING_INFO', 'RESOLVED'],
  IN_PROGRESS: ['PENDING_INFO', 'RESOLVED', 'OPEN'],
  PENDING_INFO: ['IN_PROGRESS', 'RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED', 'OPEN'],
  CLOSED: [],
};

/**
 * Generate the next issue number in format ISS-YYYY-NNNNN
 */

/**
 * Calculate SLA deadline based on severity
 */
export function calculateSlaDeadline(severity: IssueFlagSeverity): Date {
  const hours = SLA_HOURS[severity];
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

/**
 * Input for creating an issue flag
 */
export interface CreateIssueFlagInput {
  pickingSlipId?: string;
  jobCardId?: string;
  category: IssueFlagCategory;
  severity: IssueFlagSeverity;
  title: string;
  description: string;
}

/**
 * Create a new issue flag
 */
export async function createIssueFlag(
  input: CreateIssueFlagInput,
  userId: string,
  companyId: string
): Promise<{ success: boolean; issueFlag?: { id: string; issueNumber: string }; error?: string }> {
  // Validate that exactly one target is specified
  if (!input.pickingSlipId && !input.jobCardId) {
    return { success: false, error: 'Either pickingSlipId or jobCardId must be specified' };
  }
  if (input.pickingSlipId && input.jobCardId) {
    return { success: false, error: 'Only one of pickingSlipId or jobCardId can be specified' };
  }

  // Verify the target exists and belongs to the company
  if (input.pickingSlipId) {
    const pickingSlip = await prisma.pickingSlip.findFirst({
      where: { id: input.pickingSlipId, companyId },
    });
    if (!pickingSlip) {
      return { success: false, error: 'Picking slip not found' };
    }
  }

  if (input.jobCardId) {
    const jobCard = await prisma.jobCard.findFirst({
      where: { id: input.jobCardId, companyId },
    });
    if (!jobCard) {
      return { success: false, error: 'Job card not found' };
    }
  }

  // Generate issue number and calculate SLA deadline
  const issueNumber = await generateIssueNumber();
  const slaDeadline = calculateSlaDeadline(input.severity);

  // Create the issue flag
  const issueFlag = await prisma.issueFlag.create({
    data: {
      issueNumber,
      companyId,
      pickingSlipId: input.pickingSlipId || null,
      jobCardId: input.jobCardId || null,
      category: input.category,
      severity: input.severity,
      status: 'OPEN',
      title: input.title,
      description: input.description,
      slaDeadline,
      createdById: userId,
    },
  });

  // Fire-and-forget notification — resolve order from picking slip or job card
  try {
    let orderId: string | undefined;
    let orderNumber: string | undefined;

    if (input.pickingSlipId) {
      const ps = await prisma.pickingSlip.findUnique({
        where: { id: input.pickingSlipId },
        select: { orderId: true, orderNumber: true },
      });
      orderId = ps?.orderId;
      orderNumber = ps?.orderNumber;
    } else if (input.jobCardId) {
      const jc = await prisma.jobCard.findUnique({
        where: { id: input.jobCardId },
        select: { orderId: true, orderNumber: true },
      });
      orderId = jc?.orderId;
      orderNumber = jc?.orderNumber;
    }

    if (orderId && orderNumber) {
      notifyIssueFlagged(orderId, orderNumber, input.title, companyId)
        .catch(() => {/* notification failure is non-blocking */});
    }
  } catch {
    // Notification lookup failure is non-blocking
  }

  return {
    success: true,
    issueFlag: {
      id: issueFlag.id,
      issueNumber: issueFlag.issueNumber,
    },
  };
}

/**
 * Get issue flags with filtering and pagination
 */
export async function getIssueFlags(options: {
  companyId: string;
  pickingSlipId?: string;
  jobCardId?: string;
  status?: IssueFlagStatus;
  severity?: IssueFlagSeverity;
  category?: IssueFlagCategory;
  page?: number;
  pageSize?: number;
}): Promise<{
  issueFlags: Array<{
    id: string;
    issueNumber: string;
    category: IssueFlagCategory;
    severity: IssueFlagSeverity;
    status: IssueFlagStatus;
    title: string;
    slaDeadline: Date;
    pickingSlipNumber: string | null;
    jobCardNumber: string | null;
    createdAt: Date;
    createdByName: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const { companyId, pickingSlipId, jobCardId, status, severity, category, page = 1, pageSize = 20 } = options;

  const where: Prisma.IssueFlagWhereInput = {
    companyId,
  };

  if (pickingSlipId) {
    where.pickingSlipId = pickingSlipId;
  }

  if (jobCardId) {
    where.jobCardId = jobCardId;
  }

  if (status) {
    where.status = status;
  }

  if (severity) {
    where.severity = severity;
  }

  if (category) {
    where.category = category;
  }

  const [total, issueFlags] = await Promise.all([
    prisma.issueFlag.count({ where }),
    prisma.issueFlag.findMany({
      where,
      include: {
        pickingSlip: { select: { pickingSlipNumber: true } },
        jobCard: { select: { jobCardNumber: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: [
        { status: 'asc' }, // Show open issues first
        { severity: 'asc' }, // Then by severity (CRITICAL first)
        { slaDeadline: 'asc' }, // Then by urgency
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    issueFlags: issueFlags.map((issue) => ({
      id: issue.id,
      issueNumber: issue.issueNumber,
      category: issue.category,
      severity: issue.severity,
      status: issue.status,
      title: issue.title,
      slaDeadline: issue.slaDeadline,
      pickingSlipNumber: issue.pickingSlip?.pickingSlipNumber || null,
      jobCardNumber: issue.jobCard?.jobCardNumber || null,
      createdAt: issue.createdAt,
      createdByName: `${issue.createdBy.firstName} ${issue.createdBy.lastName}`,
    })),
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get issue flag by ID with full details
 */
export async function getIssueFlagById(id: string, companyId: string) {
  const issueFlag = await prisma.issueFlag.findFirst({
    where: {
      id,
      companyId,
    },
    include: {
      pickingSlip: { select: { id: true, pickingSlipNumber: true, orderNumber: true } },
      jobCard: { select: { id: true, jobCardNumber: true, orderNumber: true, productSku: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      resolvedBy: { select: { firstName: true, lastName: true } },
      comments: {
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!issueFlag) {
    return null;
  }

  return {
    id: issueFlag.id,
    issueNumber: issueFlag.issueNumber,
    companyId: issueFlag.companyId,
    category: issueFlag.category,
    severity: issueFlag.severity,
    status: issueFlag.status,
    title: issueFlag.title,
    description: issueFlag.description,
    slaDeadline: issueFlag.slaDeadline,
    escalatedAt: issueFlag.escalatedAt,
    resolution: issueFlag.resolution,
    resolvedAt: issueFlag.resolvedAt,
    resolvedByName: issueFlag.resolvedBy
      ? `${issueFlag.resolvedBy.firstName} ${issueFlag.resolvedBy.lastName}`
      : null,
    createdAt: issueFlag.createdAt,
    createdByName: `${issueFlag.createdBy.firstName} ${issueFlag.createdBy.lastName}`,
    updatedAt: issueFlag.updatedAt,
    pickingSlip: issueFlag.pickingSlip
      ? {
          id: issueFlag.pickingSlip.id,
          pickingSlipNumber: issueFlag.pickingSlip.pickingSlipNumber,
          orderNumber: issueFlag.pickingSlip.orderNumber,
        }
      : null,
    jobCard: issueFlag.jobCard
      ? {
          id: issueFlag.jobCard.id,
          jobCardNumber: issueFlag.jobCard.jobCardNumber,
          orderNumber: issueFlag.jobCard.orderNumber,
          productSku: issueFlag.jobCard.productSku,
        }
      : null,
    comments: issueFlag.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      createdByName: `${comment.createdBy.firstName} ${comment.createdBy.lastName}`,
    })),
  };
}

/**
 * Get issues for a picking slip
 */
export async function getIssuesForPickingSlip(
  pickingSlipId: string,
  companyId: string
): Promise<Array<{
  id: string;
  issueNumber: string;
  category: IssueFlagCategory;
  severity: IssueFlagSeverity;
  status: IssueFlagStatus;
  title: string;
}>> {
  const issues = await prisma.issueFlag.findMany({
    where: {
      pickingSlipId,
      companyId,
    },
    orderBy: [{ status: 'asc' }, { severity: 'asc' }],
  });

  return issues.map((issue) => ({
    id: issue.id,
    issueNumber: issue.issueNumber,
    category: issue.category,
    severity: issue.severity,
    status: issue.status,
    title: issue.title,
  }));
}

/**
 * Get issues for a job card
 */
export async function getIssuesForJobCard(
  jobCardId: string,
  companyId: string
): Promise<Array<{
  id: string;
  issueNumber: string;
  category: IssueFlagCategory;
  severity: IssueFlagSeverity;
  status: IssueFlagStatus;
  title: string;
}>> {
  const issues = await prisma.issueFlag.findMany({
    where: {
      jobCardId,
      companyId,
    },
    orderBy: [{ status: 'asc' }, { severity: 'asc' }],
  });

  return issues.map((issue) => ({
    id: issue.id,
    issueNumber: issue.issueNumber,
    category: issue.category,
    severity: issue.severity,
    status: issue.status,
    title: issue.title,
  }));
}

/**
 * Get issue stats for dashboard
 */
export async function getIssueStats(companyId: string): Promise<{
  total: number;
  bySeverity: Record<IssueFlagSeverity, number>;
  byStatus: Record<IssueFlagStatus, number>;
  overdue: number;
}> {
  const now = new Date();

  // Get all open issues (not RESOLVED or CLOSED)
  const openIssues = await prisma.issueFlag.findMany({
    where: {
      companyId,
      status: { notIn: ['RESOLVED', 'CLOSED'] },
    },
    select: {
      severity: true,
      status: true,
      slaDeadline: true,
    },
  });

  // Initialize counters
  const bySeverity: Record<IssueFlagSeverity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  const byStatus: Record<IssueFlagStatus, number> = {
    OPEN: 0,
    IN_PROGRESS: 0,
    PENDING_INFO: 0,
    RESOLVED: 0,
    CLOSED: 0,
  };

  let overdue = 0;

  for (const issue of openIssues) {
    bySeverity[issue.severity]++;
    byStatus[issue.status]++;
    if (issue.slaDeadline < now) {
      overdue++;
    }
  }

  return {
    total: openIssues.length,
    bySeverity,
    byStatus,
    overdue,
  };
}

/**
 * Update issue status
 */
export async function updateStatus(
  id: string,
  newStatus: IssueFlagStatus,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const issueFlag = await prisma.issueFlag.findFirst({
    where: { id, companyId },
  });

  if (!issueFlag) {
    return { success: false, error: 'Issue flag not found' };
  }

  // Check valid transition
  const allowedTransitions = ISSUE_STATUS_TRANSITIONS[issueFlag.status];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot transition from ${issueFlag.status} to ${newStatus}`,
    };
  }

  await prisma.issueFlag.update({
    where: { id },
    data: { status: newStatus },
  });

  return { success: true };
}

/**
 * Add a comment to an issue
 */
export async function addComment(
  issueFlagId: string,
  content: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; comment?: { id: string; content: string; createdAt: Date }; error?: string }> {
  const issueFlag = await prisma.issueFlag.findFirst({
    where: { id: issueFlagId, companyId },
  });

  if (!issueFlag) {
    return { success: false, error: 'Issue flag not found' };
  }

  if (!content.trim()) {
    return { success: false, error: 'Comment content is required' };
  }

  const comment = await prisma.issueComment.create({
    data: {
      issueFlagId,
      content: content.trim(),
      createdById: userId,
    },
  });

  return {
    success: true,
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
    },
  };
}

/**
 * Resolve an issue with resolution text
 */
export async function resolveIssue(
  id: string,
  resolution: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const issueFlag = await prisma.issueFlag.findFirst({
    where: { id, companyId },
  });

  if (!issueFlag) {
    return { success: false, error: 'Issue flag not found' };
  }

  if (issueFlag.status === 'CLOSED') {
    return { success: false, error: 'Cannot resolve a closed issue' };
  }

  if (!resolution.trim()) {
    return { success: false, error: 'Resolution text is required' };
  }

  await prisma.issueFlag.update({
    where: { id },
    data: {
      status: 'RESOLVED',
      resolution: resolution.trim(),
      resolvedAt: new Date(),
      resolvedById: userId,
    },
  });

  return { success: true };
}

/**
 * Close a resolved issue
 */
export async function closeIssue(
  id: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const issueFlag = await prisma.issueFlag.findFirst({
    where: { id, companyId },
  });

  if (!issueFlag) {
    return { success: false, error: 'Issue flag not found' };
  }

  if (issueFlag.status !== 'RESOLVED') {
    return { success: false, error: 'Only resolved issues can be closed' };
  }

  await prisma.issueFlag.update({
    where: { id },
    data: { status: 'CLOSED' },
  });

  return { success: true };
}

/**
 * Check if there are open issues for a picking slip
 */
export async function hasOpenIssues(
  pickingSlipId?: string,
  jobCardId?: string,
  companyId?: string
): Promise<boolean> {
  const where: Prisma.IssueFlagWhereInput = {
    status: { notIn: ['RESOLVED', 'CLOSED'] },
  };

  if (pickingSlipId) {
    where.pickingSlipId = pickingSlipId;
  }

  if (jobCardId) {
    where.jobCardId = jobCardId;
  }

  if (companyId) {
    where.companyId = companyId;
  }

  const count = await prisma.issueFlag.count({ where });
  return count > 0;
}
