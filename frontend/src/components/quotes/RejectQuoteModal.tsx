'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRejectQuote } from '@/hooks/useQuotes';
import type { RejectionReason } from '@/lib/api';

interface RejectQuoteModalProps {
  quoteId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const REJECTION_REASONS: { value: RejectionReason; label: string }[] = [
  { value: 'PRICE_TOO_HIGH', label: 'Price too high' },
  { value: 'LEAD_TIME', label: 'Lead time too long' },
  { value: 'WENT_ELSEWHERE', label: 'Went with another supplier' },
  { value: 'PROJECT_CHANGED', label: 'Project changed/cancelled' },
  { value: 'SPECS_MISMATCH', label: "Specs didn't match requirements" },
  { value: 'OTHER', label: 'Other' },
];

export function RejectQuoteModal({ quoteId, isOpen, onClose, onSuccess }: RejectQuoteModalProps) {
  const [selectedReason, setSelectedReason] = useState<RejectionReason | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const rejectQuote = useRejectQuote();

  const handleReject = async (withFeedback: boolean) => {
    try {
      setError(null);

      const data = withFeedback && (selectedReason || notes.trim())
        ? {
            reason: selectedReason || undefined,
            notes: notes.trim() || undefined,
          }
        : undefined;

      await rejectQuote.mutateAsync({ quoteId, data });

      // Reset and close
      setSelectedReason(null);
      setNotes('');
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject quote');
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-red-500" />
            Reject Quote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Mind telling us why? <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="space-y-2">
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={() => setSelectedReason(reason.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-700">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes Textarea */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional feedback <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us more..."
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{notes.length}/1000</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleReject(false)}
              disabled={rejectQuote.isPending}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              Skip
            </button>
            <button
              onClick={() => handleReject(true)}
              disabled={rejectQuote.isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {rejectQuote.isPending ? 'Rejecting...' : 'Submit & Reject'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
