'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import type { IssueComment } from '@/lib/api';
import { formatDateTime } from '@/lib/formatting';

interface IssueCommentThreadProps {
  comments: IssueComment[];
  onAddComment: (content: string) => Promise<void>;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function IssueCommentThread({
  comments,
  onAddComment,
  isSubmitting,
  disabled,
}: IssueCommentThreadProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    await onAddComment(newComment.trim());
    setNewComment('');
  };

  return (
    <div className="space-y-4">
      {/* Comments list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-900">
                  {comment.createdByName}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDateTime(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      {!disabled && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="self-end px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
