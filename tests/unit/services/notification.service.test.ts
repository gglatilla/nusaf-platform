/**
 * Notification Service — Unit Tests
 *
 * Tests CRUD operations, recipient resolution, and trigger functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================================
// MOCK SETUP
// =============================================================================

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      notification: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      company: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock('../../../backend/src/config/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../../backend/src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../../backend/src/services/email.service', () => ({
  sendOrderConfirmedEmail: vi.fn().mockResolvedValue({ success: true }),
  sendOrderDispatchedEmail: vi.fn().mockResolvedValue({ success: true }),
  sendOrderReadyForCollectionEmail: vi.fn().mockResolvedValue({ success: true }),
}));

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getStaffRecipientsForOrder,
  getCustomerRecipientsForOrder,
  notifyOrderConfirmed,
  notifyIssueFlagged,
} from '../../../backend/src/services/notification.service';

// =============================================================================
// TESTS
// =============================================================================

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // CRUD
  // --------------------------------------------------------------------------

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        {
          id: 'n1',
          type: 'ORDER_CONFIRMED',
          title: 'Order Accepted',
          message: 'Your order SO-2026-00001 has been accepted.',
          orderId: 'order-1',
          orderNumber: 'SO-2026-00001',
          readAt: null,
          createdAt: new Date(),
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await getNotifications('user-1', { page: 1, pageSize: 20 });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].title).toBe('Order Accepted');
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        })
      );
    });

    it('should filter by unread when unreadOnly is true', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await getNotifications('user-1', { page: 1, pageSize: 20, unreadOnly: true });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', readAt: null },
        })
      );
    });

    it('should calculate correct pagination for page 2', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(25);

      const result = await getNotifications('user-1', { page: 2, pageSize: 10 });

      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 10,
        totalItems: 25,
        totalPages: 3,
      });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const count = await getUnreadCount('user-1');

      expect(count).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
      });
    });
  });

  describe('markAsRead', () => {
    it('should update readAt for the notification owned by user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await markAsRead('n1', 'user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'n1', userId: 'user-1' },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      await markAllAsRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification owned by user', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 1 });

      await deleteNotification('n1', 'user-1');

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: 'n1', userId: 'user-1' },
      });
    });
  });

  // --------------------------------------------------------------------------
  // RECIPIENT RESOLUTION
  // --------------------------------------------------------------------------

  describe('getStaffRecipientsForOrder', () => {
    it('should return assigned sales rep when set', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        assignedSalesRepId: 'rep-1',
      });

      const result = await getStaffRecipientsForOrder('company-1');

      expect(result).toEqual(['rep-1']);
      // Should NOT query for internal company users
      expect(mockPrisma.company.findFirst).not.toHaveBeenCalled();
    });

    it('should fallback to internal company staff when no sales rep assigned', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        assignedSalesRepId: null,
      });
      mockPrisma.company.findFirst.mockResolvedValue({ id: 'nusaf-internal' });
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'staff-1' },
        { id: 'staff-2' },
      ]);

      const result = await getStaffRecipientsForOrder('company-1');

      expect(result).toEqual(['staff-1', 'staff-2']);
      expect(mockPrisma.company.findFirst).toHaveBeenCalledWith({
        where: { isInternal: true },
        select: { id: true },
      });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 'nusaf-internal',
          isActive: true,
          role: { in: ['SALES', 'MANAGER', 'ADMIN'] },
        },
        select: { id: true },
      });
    });

    it('should return empty array when no internal company exists', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        assignedSalesRepId: null,
      });
      mockPrisma.company.findFirst.mockResolvedValue(null);

      const result = await getStaffRecipientsForOrder('company-1');

      expect(result).toEqual([]);
    });
  });

  describe('getCustomerRecipientsForOrder', () => {
    it('should return active customer users with email details', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'cust-1', email: 'a@test.com', firstName: 'Alice', lastName: 'Smith' },
        { id: 'cust-2', email: 'b@test.com', firstName: 'Bob', lastName: 'Jones' },
      ]);

      const result = await getCustomerRecipientsForOrder('company-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'cust-1', email: 'a@test.com', firstName: 'Alice', lastName: 'Smith' });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 'company-1',
          isActive: true,
          role: 'CUSTOMER',
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });
    });

    it('should return empty array when company has no active customers', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await getCustomerRecipientsForOrder('company-1');

      expect(result).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // TRIGGER FUNCTIONS
  // --------------------------------------------------------------------------

  describe('notifyOrderConfirmed', () => {
    it('should create notifications and send emails for customer users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'cust-1', email: 'a@test.com', firstName: 'Alice', lastName: 'Smith' },
        { id: 'cust-2', email: 'b@test.com', firstName: 'Bob', lastName: 'Jones' },
      ]);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });

      await notifyOrderConfirmed('order-1', 'SO-2026-00001', 'company-1', 3);

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId: 'cust-1',
            type: 'ORDER_CONFIRMED',
            title: 'Order Accepted',
            orderId: 'order-1',
            orderNumber: 'SO-2026-00001',
          }),
          expect.objectContaining({
            userId: 'cust-2',
            type: 'ORDER_CONFIRMED',
          }),
        ],
      });

      // Verify email was sent
      const { sendOrderConfirmedEmail } = await import('../../../backend/src/services/email.service');
      expect(sendOrderConfirmedEmail).toHaveBeenCalledTimes(2);
      expect(sendOrderConfirmedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'a@test.com',
          customerName: 'Alice',
          orderNumber: 'SO-2026-00001',
          lineCount: 3,
        })
      );
    });

    it('should not throw when no customer users exist', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await expect(
        notifyOrderConfirmed('order-1', 'SO-2026-00001', 'company-1')
      ).resolves.toBeUndefined();

      expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
    });

    it('should not throw on database error (fire-and-forget)', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        notifyOrderConfirmed('order-1', 'SO-2026-00001', 'company-1')
      ).resolves.toBeUndefined();
    });
  });

  describe('notifyIssueFlagged', () => {
    it('should create notifications for staff users with issue reason', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        assignedSalesRepId: 'rep-1',
      });
      mockPrisma.notification.createMany.mockResolvedValue({ count: 1 });

      await notifyIssueFlagged('order-1', 'SO-2026-00001', 'Missing parts', 'company-1');

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId: 'rep-1',
            type: 'ISSUE_FLAGGED',
            title: 'Issue Flagged',
            message: 'Issue on order SO-2026-00001: Missing parts',
          }),
        ],
      });
    });
  });
});
