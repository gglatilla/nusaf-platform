import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../../services/notification.service';

const router = Router();

/**
 * Validation schemas
 */
const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

/**
 * GET /api/v1/notifications
 * List notifications for the authenticated user (paginated)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const queryResult = notificationListQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
      });
    }

    const { page, pageSize, unreadOnly } = queryResult.data;
    const result = await getNotifications(req.user!.id, { page, pageSize, unreadOnly });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List notifications error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATIONS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch notifications',
      },
    });
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Get the number of unread notifications for badge display
 */
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user!.id);

    return res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Unread count error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UNREAD_COUNT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get unread count',
      },
    });
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await markAsRead(req.params.id, req.user!.id);

    return res.json({
      success: true,
      data: { message: 'Notification marked as read' },
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'MARK_READ_ERROR',
        message: error instanceof Error ? error.message : 'Failed to mark notification as read',
      },
    });
  }
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await markAllAsRead(req.user!.id);

    return res.json({
      success: true,
      data: { message: 'All notifications marked as read' },
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'MARK_ALL_READ_ERROR',
        message: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      },
    });
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Delete a single notification
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await deleteNotification(req.params.id, req.user!.id);

    return res.json({
      success: true,
      data: { message: 'Notification deleted' },
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_NOTIFICATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete notification',
      },
    });
  }
});

export default router;
