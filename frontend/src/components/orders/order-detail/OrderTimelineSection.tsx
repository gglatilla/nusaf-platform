'use client';

import Link from 'next/link';
import {
  Clock,
  Check,
  Package,
  ClipboardList,
  Wrench,
  Truck,
  Pause,
  X,
  Play,
  CircleDot,
} from 'lucide-react';
import type { TimelineEvent, TimelineEventType } from '@/lib/api';
import { formatDateTime } from '@/lib/formatting';

interface OrderTimelineSectionProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

const EVENT_CONFIG: Record<TimelineEventType, {
  icon: typeof Clock;
  color: string;
  dotColor: string;
}> = {
  ORDER_CREATED: { icon: CircleDot, color: 'text-slate-500', dotColor: 'bg-slate-400' },
  ORDER_CONFIRMED: { icon: Check, color: 'text-green-600', dotColor: 'bg-green-500' },
  ORDER_PROCESSING: { icon: Play, color: 'text-blue-600', dotColor: 'bg-blue-500' },
  ORDER_READY_TO_SHIP: { icon: Package, color: 'text-indigo-600', dotColor: 'bg-indigo-500' },
  ORDER_SHIPPED: { icon: Truck, color: 'text-blue-600', dotColor: 'bg-blue-500' },
  ORDER_DELIVERED: { icon: Check, color: 'text-green-600', dotColor: 'bg-green-500' },
  ORDER_ON_HOLD: { icon: Pause, color: 'text-amber-600', dotColor: 'bg-amber-500' },
  ORDER_HOLD_RELEASED: { icon: Play, color: 'text-green-600', dotColor: 'bg-green-500' },
  ORDER_CANCELLED: { icon: X, color: 'text-red-600', dotColor: 'bg-red-500' },
  PICKING_SLIP_CREATED: { icon: ClipboardList, color: 'text-indigo-500', dotColor: 'bg-indigo-400' },
  PICKING_SLIP_STARTED: { icon: Play, color: 'text-indigo-600', dotColor: 'bg-indigo-500' },
  PICKING_SLIP_COMPLETED: { icon: Check, color: 'text-indigo-600', dotColor: 'bg-indigo-500' },
  JOB_CARD_CREATED: { icon: Wrench, color: 'text-purple-500', dotColor: 'bg-purple-400' },
  JOB_CARD_STARTED: { icon: Play, color: 'text-purple-600', dotColor: 'bg-purple-500' },
  JOB_CARD_ON_HOLD: { icon: Pause, color: 'text-amber-600', dotColor: 'bg-amber-500' },
  JOB_CARD_COMPLETED: { icon: Check, color: 'text-purple-600', dotColor: 'bg-purple-500' },
  TRANSFER_CREATED: { icon: Truck, color: 'text-blue-500', dotColor: 'bg-blue-400' },
  TRANSFER_SHIPPED: { icon: Truck, color: 'text-blue-600', dotColor: 'bg-blue-500' },
  TRANSFER_RECEIVED: { icon: Check, color: 'text-blue-600', dotColor: 'bg-blue-500' },
  FULFILLMENT_PLAN_EXECUTED: { icon: Package, color: 'text-primary-600', dotColor: 'bg-primary-500' },
};

const DOCUMENT_ROUTES: Record<string, string> = {
  PickingSlip: '/picking-slips',
  JobCard: '/job-cards',
  TransferRequest: '/transfer-requests',
};

export function OrderTimelineSection({ events, isLoading }: OrderTimelineSectionProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity</h2>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2 h-2 mt-2 bg-slate-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-2 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity</h2>
        <p className="text-sm text-slate-500">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity</h2>
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-slate-200" />

        <div className="space-y-4">
          {events.map((event) => {
            const config = EVENT_CONFIG[event.type] || {
              icon: Clock,
              color: 'text-slate-500',
              dotColor: 'bg-slate-400',
            };
            const Icon = config.icon;
            const route = event.documentType ? DOCUMENT_ROUTES[event.documentType] : null;

            return (
              <div key={event.id} className="flex gap-3 relative">
                {/* Timeline dot */}
                <div
                  className={`w-[11px] h-[11px] rounded-full ${config.dotColor} flex-shrink-0 mt-1 z-10 ring-2 ring-white`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5">
                    <Icon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${config.color}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 leading-tight">
                        {event.title}
                      </p>
                      {event.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {route && event.documentId ? (
                            <Link
                              href={`${route}/${event.documentId}`}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {event.description}
                            </Link>
                          ) : (
                            event.description
                          )}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(event.timestamp)}
                        </span>
                        {event.actor && (
                          <>
                            <span className="text-[11px] text-slate-300">·</span>
                            <span className="text-[11px] text-slate-400 truncate">
                              {event.actor}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
