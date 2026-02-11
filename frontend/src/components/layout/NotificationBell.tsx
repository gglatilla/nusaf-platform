'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  useUnreadNotificationCount,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';
import type { AppNotification } from '@/lib/api';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
  });
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'ORDER_CONFIRMED':
      return '📦';
    case 'ORDER_RECEIVED':
      return '🛒';
    case 'ORDER_DISPATCHED':
      return '🚚';
    case 'ORDER_READY_FOR_COLLECTION':
      return '📍';
    case 'PICKING_STARTED':
      return '📋';
    case 'JOB_CARD_STARTED':
      return '🔧';
    case 'JOB_CARD_COMPLETE':
      return '✅';
    case 'TRANSFER_SHIPPED':
      return '🚛';
    case 'TRANSFER_RECEIVED':
      return '📥';
    case 'ORDER_READY_TO_INVOICE':
      return '💰';
    case 'ISSUE_FLAGGED':
      return '⚠️';
    default:
      return '🔔';
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const isCustomer = user?.role === 'CUSTOMER';

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: notificationsData, isLoading } = useNotifications({ enabled: isOpen });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: AppNotification): void => {
    // Mark as read if unread
    if (!notification.readAt) {
      markRead.mutate(notification.id);
    }

    // Navigate to order if linked
    if (notification.orderId) {
      const basePath = isCustomer ? '/my/orders' : '/orders';
      router.push(`${basePath}/${notification.orderId}`);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = (): void => {
    markAllRead.mutate();
  };

  const notifications = notificationsData?.notifications ?? [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4.5 w-4.5 min-w-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">
              Notifications
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No notifications</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors flex items-start gap-3',
                    !notification.readAt && 'bg-primary-50/40'
                  )}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    {!notification.readAt ? (
                      <div className="h-2 w-2 rounded-full bg-primary-500" />
                    ) : (
                      <div className="h-2 w-2" />
                    )}
                  </div>

                  {/* Icon */}
                  <span className="flex-shrink-0 text-base mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm text-slate-900 truncate',
                      !notification.readAt && 'font-medium'
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Read indicator */}
                  {notification.readAt && (
                    <Check className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 mt-1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
