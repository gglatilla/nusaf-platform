'use client';

import { cn } from '@/lib/utils';

interface PublishStatusBadgeProps {
  isPublished: boolean;
  publishedAt?: Date | string | null;
  size?: 'sm' | 'md';
}

export function PublishStatusBadge({ isPublished, publishedAt, size = 'md' }: PublishStatusBadgeProps) {
  // Format the published date for tooltip
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded',
        sizeClasses[size],
        isPublished
          ? 'bg-green-100 text-green-700'
          : 'bg-slate-100 text-slate-600'
      )}
      title={isPublished && formattedDate ? `Published on ${formattedDate}` : undefined}
    >
      {isPublished ? 'Published' : 'Draft'}
    </span>
  );
}
