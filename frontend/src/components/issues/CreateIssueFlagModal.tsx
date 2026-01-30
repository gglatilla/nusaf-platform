'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { IssueFlagCategory, IssueFlagSeverity, CreateIssueFlagData } from '@/lib/api';

interface CreateIssueFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIssueFlagData) => Promise<void>;
  pickingSlipId?: string;
  jobCardId?: string;
  targetLabel: string;
}

const CATEGORIES: { value: IssueFlagCategory; label: string }[] = [
  { value: 'STOCK', label: 'Stock - Inventory discrepancy or shortage' },
  { value: 'QUALITY', label: 'Quality - Defects or quality issues' },
  { value: 'PRODUCTION', label: 'Production - Manufacturing or assembly problems' },
  { value: 'TIMING', label: 'Timing - Delays or scheduling issues' },
  { value: 'DOCUMENTATION', label: 'Documentation - Paperwork or data issues' },
];

const SEVERITIES: { value: IssueFlagSeverity; label: string; sla: string }[] = [
  { value: 'CRITICAL', label: 'Critical', sla: '4 hours' },
  { value: 'HIGH', label: 'High', sla: '24 hours' },
  { value: 'MEDIUM', label: 'Medium', sla: '72 hours' },
  { value: 'LOW', label: 'Low', sla: '1 week' },
];

export function CreateIssueFlagModal({
  isOpen,
  onClose,
  onSubmit,
  pickingSlipId,
  jobCardId,
  targetLabel,
}: CreateIssueFlagModalProps) {
  const [category, setCategory] = useState<IssueFlagCategory>('STOCK');
  const [severity, setSeverity] = useState<IssueFlagSeverity>('MEDIUM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        pickingSlipId,
        jobCardId,
        category,
        severity,
        title: title.trim(),
        description: description.trim(),
      });
      // Reset form
      setCategory('STOCK');
      setSeverity('MEDIUM');
      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedSeverity = SEVERITIES.find((s) => s.value === severity);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900">Flag Issue</h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {/* Target info */}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-600">
                  Creating issue for: <span className="font-medium text-slate-900">{targetLabel}</span>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueFlagCategory)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Severity
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITIES.map((sev) => (
                    <button
                      key={sev.value}
                      type="button"
                      onClick={() => setSeverity(sev.value)}
                      className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                        severity === sev.value
                          ? sev.value === 'CRITICAL'
                            ? 'bg-red-100 border-red-300 text-red-700'
                            : sev.value === 'HIGH'
                              ? 'bg-orange-100 border-orange-300 text-orange-700'
                              : sev.value === 'MEDIUM'
                                ? 'bg-amber-100 border-amber-300 text-amber-700'
                                : 'bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {sev.label}
                    </button>
                  ))}
                </div>
                {selectedSeverity && (
                  <p className="mt-1 text-xs text-slate-500">
                    SLA target: {selectedSeverity.sla}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of the issue"
                  maxLength={200}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information about the issue, what was observed, and any relevant context"
                  rows={4}
                  maxLength={2000}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !description.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Issue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
