import { NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import {
  sendOrderConfirmedEmail,
  sendOrderDispatchedEmail,
  sendOrderReadyForCollectionEmail,
} from './email.service';

// ============================================
// CRUD OPERATIONS
// ============================================

interface GetNotificationsOptions {
  page: number;
  pageSize: number;
  unreadOnly?: boolean;
}

interface PaginatedNotifications {
  notifications: Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    orderId: string | null;
    orderNumber: string | null;
    readAt: Date | null;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export async function getNotifications(
  userId: string,
  options: GetNotificationsOptions
): Promise<PaginatedNotifications> {
  const { page, pageSize, unreadOnly } = options;

  const where = {
    userId,
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const [notifications, totalItems] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        orderId: true,
        orderNumber: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
}

// ============================================
// INTERNAL: CREATE NOTIFICATION
// ============================================

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
}

async function createNotificationsForUsers(
  userIds: string[],
  data: Omit<CreateNotificationData, 'userId'>
): Promise<void> {
  if (userIds.length === 0) return;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      orderId: data.orderId ?? null,
      orderNumber: data.orderNumber ?? null,
    })),
  });
}

// ============================================
// RECIPIENT RESOLUTION
// ============================================

/**
 * Get internal staff user IDs who should be notified about an order.
 * Priority: company's assigned sales rep > all active SALES/MANAGER users of the internal company.
 */
export async function getStaffRecipientsForOrder(companyId: string): Promise<string[]> {
  // Always look up the internal company — warehouse users must always be notified
  const internalCompany = await prisma.company.findFirst({
    where: { isInternal: true },
    select: { id: true },
  });

  if (!internalCompany) return [];

  // Check if the customer's company has an assigned sales rep
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { assignedSalesRepId: true },
  });

  if (company?.assignedSalesRepId) {
    // Include assigned sales rep + all active warehouse users
    const warehouseUsers = await prisma.user.findMany({
      where: {
        companyId: internalCompany.id,
        isActive: true,
        role: 'WAREHOUSE',
      },
      select: { id: true },
    });
    const userIds = new Set([
      company.assignedSalesRepId,
      ...warehouseUsers.map((u) => u.id),
    ]);
    return Array.from(userIds);
  }

  // Fallback: find all active staff users from the internal company
  const staffUsers = await prisma.user.findMany({
    where: {
      companyId: internalCompany.id,
      isActive: true,
      role: { in: ['SALES', 'MANAGER', 'ADMIN', 'WAREHOUSE'] },
    },
    select: { id: true },
  });

  return staffUsers.map((u) => u.id);
}

interface CustomerRecipient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Get active customer users for a company (with email/name for email notifications).
 */
export async function getCustomerRecipientsForOrder(companyId: string): Promise<CustomerRecipient[]> {
  return prisma.user.findMany({
    where: {
      companyId,
      isActive: true,
      role: 'CUSTOMER',
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
}

// ============================================
// TRIGGER FUNCTIONS (fire-and-forget)
// ============================================

export async function notifyOrderConfirmed(
  orderId: string,
  orderNumber: string,
  companyId: string,
  lineCount?: number
): Promise<void> {
  try {
    const customers = await getCustomerRecipientsForOrder(companyId);
    const customerIds = customers.map((c) => c.id);
    await createNotificationsForUsers(customerIds, {
      type: 'ORDER_CONFIRMED',
      title: 'Order Accepted',
      message: `Your order ${orderNumber} has been accepted and is being processed.`,
      orderId,
      orderNumber,
    });

    // Send email to each customer
    for (const customer of customers) {
      sendOrderConfirmedEmail({
        to: customer.email,
        customerName: customer.firstName,
        orderNumber,
        lineCount: lineCount ?? 0,
      }).catch((err) => logger.error('Failed to send order confirmed email:', err));
    }
  } catch (err) {
    logger.error('Failed to send ORDER_CONFIRMED notification:', err);
  }
}

export async function notifyNewOrderForStaff(
  orderId: string,
  orderNumber: string,
  companyId: string,
  customerName: string,
  lineCount?: number
): Promise<void> {
  try {
    const staffUserIds = await getStaffRecipientsForOrder(companyId);
    await createNotificationsForUsers(staffUserIds, {
      type: 'ORDER_RECEIVED',
      title: 'New Order Received',
      message: `New order ${orderNumber} from ${customerName} (${lineCount ?? 0} line${(lineCount ?? 0) === 1 ? '' : 's'}).`,
      orderId,
      orderNumber,
    });
  } catch (err) {
    logger.error('Failed to send ORDER_RECEIVED notification:', err);
  }
}

export async function notifyPickingStarted(
  orderId: string,
  orderNumber: string,
  companyId: string
): Promise<void> {
  try {
    const staffUserIds = await getStaffRecipientsForOrder(companyId);
    await createNotificationsForUsers(staffUserIds, {
      type: 'PICKING_STARTED',
      title: 'Picking Started',
      message: `Goods are being picked for order ${orderNumber}.`,
      orderId,
      orderNumber,
    });
  } catch (err) {
    logger.error('Failed to send PICKING_STARTED notification:', err);
  }
}

export async function notifyJobCardStarted(
  orderId: string,
  orderNumber: string,
  companyId: string
): Promise<void> {
  try {
    const staffUserIds = await getStaffRecipientsForOrder(companyId);
    await createNotificationsForUsers(staffUserIds, {
      type: 'JOB_CARD_STARTED',
      title: 'Manufacturing Started',
      message: `Machining/assembly has started for order ${orderNumber}.`,
      orderId,
      orderNumber,
    });
  } catch (err) {
    logger.error('Failed to send JOB_CARD_STARTED notification:', err);
  }
}

export async function notifyJobCardComplete(
  orderId: string,
  orderNumber: string,
  companyId: string
): Promise<void> {
  try {
    const staffUserIds = await getStaffRecipientsForOrder(companyId);
    await createNotificationsForUsers(staffUserIds, {
      type: 'JOB_CARD_COMPLETE',
      title: 'Manufacturing Complete',
      message: `Machining/assembly is complete for order ${orderNumber}.`,
      orderId,
      orderNumber,
    });
  } catch (err) {
    logger.error('Failed to send JOB_CARD_COMPLETE notification:', err);
  }
}

export async function notifyTransferShipped(
  orderId: string,
  orderNumber: string,
  companyId: string
): Promise<void> {
  try {
    const staffUserIds = await getStaffRecipientsForOrder(companyId);
    await createNotificationsForUsers(staffUserIds, {
      type: 'TRANSFER_SHIPPED',
      title: 'Transfer Shipped',
      message: `Goods are in transit to Cape Town for order ${orderNumber}.`,
      orderId,
      orderNumber,
    });
  } catch (err) {
    logger.error('Failed to send TRANSFER_SHIPPED notification:', err);
  }
}

export async function notifyTransferReceived(
  orderId: string,
  orderNumber: string,
  companyId: string
): Promise<void> {
  try {
    const staffUserIds = await getStaffRecipientsForOrder(companyId);
    await createNotificationsForUsers(staffUserIds, {
      type: 'TRANSFER_RECEIVED',
      title: 'Transfer Received',
      message: `Goods have been received in Cape Town for order ${orderNumber}.`,
      orderId,
      orderNumber,
    });
  } catch (err) {
    logger.error('Failed to send TRANSFER_RECEIVED notification:', err);
  }
}

export async function notifyOrderReadyToInvoice(
  orderId: string,
  orderNumber: string,
  companyId: string
): Promise<void> {
  try {
    const staffUserIds = await getStaffRecipientsForOrder(companyId);
    await createNotificationsForUsers(staffUserIds, {
      type: 'ORDER_READY_TO_INVOICE',
      title: 'Ready to Invoice',
      message: `Order ${orderNumber} is ready for invoicing.`,
      orderId,
      orderNumber,
    });
  } catch (err) {
    logger.error('Failed to send ORDER_READY_TO_INVOICE notification:', err);
  }
}

export async function notifyOrderDispatched(
  orderId: string,
  orderNumber: string,
  companyId: string
): Promise<void> {
  try {
    const customers = await getCustomerRecipientsForOrder(companyId);
    const customerIds = customers.map((c) => c.id);
    await createNotificationsForUsers(customerIds, {
      type: 'ORDER_DISPATCHED',
      title: 'Order Dispatched',
      message: `Your order ${orderNumber} has been dispatched.`,
      orderId,
      orderNumber,
    });

    // Send email to each customer
    for (const customer of customers) {
      sendOrderDispatchedEmail({
        to: customer.email,
        customerName: customer.firstName,
        orderNumber,
      }).catch((err) => logger.error('Failed to send order dispatched email:', err));
    }
  } catch (err) {
    logger.error('Failed to send ORDER_DISPATCHED notification:', err);
  }
}

export async function notifyOrderReadyForCollection(
  orderId: string,
  orderNumber: string,
  companyId: string,
  warehouse?: string
): Promise<void> {
  try {
    const customers = await getCustomerRecipientsForOrder(companyId);
    const customerIds = customers.map((c) => c.id);
    await createNotificationsForUsers(customerIds, {
      type: 'ORDER_READY_FOR_COLLECTION',
      title: 'Ready for Collection',
      message: `Your order ${orderNumber} is ready for collection.`,
      orderId,
      orderNumber,
    });

    // Send email to each customer
    for (const customer of customers) {
      sendOrderReadyForCollectionEmail({
        to: customer.email,
        customerName: customer.firstName,
        orderNumber,
        warehouse: warehouse ?? 'JHB',
      }).catch((err) => logger.error('Failed to send ready for collection email:', err));
    }
  } catch (err) {
    logger.error('Failed to send ORDER_READY_FOR_COLLECTION notification:', err);
  }
}

export async function notifyIssueFlagged(
  orderId: string,
  orderNumber: string,
  reason: string,
  companyId: string
): Promise<void> {
  try {
    const staffUserIds = await getStaffRecipientsForOrder(companyId);
    await createNotificationsForUsers(staffUserIds, {
      type: 'ISSUE_FLAGGED',
      title: 'Issue Flagged',
      message: `Issue on order ${orderNumber}: ${reason}`,
      orderId,
      orderNumber,
    });
  } catch (err) {
    logger.error('Failed to send ISSUE_FLAGGED notification:', err);
  }
}
