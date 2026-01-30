'use client';

import { useState } from 'react';
import { X, Wrench, Layers } from 'lucide-react';
import type { SalesOrderLine, JobType } from '@/lib/api';

interface CreateJobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderLines: SalesOrderLine[];
  onCreateJobCard: (data: {
    orderLineId: string;
    jobType: JobType;
    notes?: string;
  }) => Promise<void>;
  isCreating: boolean;
}

export function CreateJobCardModal({
  isOpen,
  onClose,
  orderLines,
  onCreateJobCard,
  isCreating,
}: CreateJobCardModalProps) {
  const [selectedLineId, setSelectedLineId] = useState<string>('');
  const [selectedJobType, setSelectedJobType] = useState<JobType | ''>('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const selectedLine = orderLines.find((line) => line.id === selectedLineId);

  const handleSubmit = async () => {
    if (!selectedLineId || !selectedJobType) return;

    await onCreateJobCard({
      orderLineId: selectedLineId,
      jobType: selectedJobType,
      notes: notes || undefined,
    });

    // Reset form
    setSelectedLineId('');
    setSelectedJobType('');
    setNotes('');
  };

  const handleClose = () => {
    setSelectedLineId('');
    setSelectedJobType('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Create Job Card</h3>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Order Line Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Order Line
              </label>
              <select
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a line...</option>
                {orderLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    Line {line.lineNumber}: {line.productSku} - {line.productDescription.substring(0, 50)}
                    {line.productDescription.length > 50 ? '...' : ''} (Qty: {line.quantityOrdered})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Line Preview */}
            {selectedLine && (
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-sm font-medium text-slate-900">{selectedLine.productSku}</div>
                <div className="text-xs text-slate-600 mt-1">{selectedLine.productDescription}</div>
                <div className="text-xs text-slate-500 mt-1">Quantity: {selectedLine.quantityOrdered}</div>
              </div>
            )}

            {/* Job Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Job Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedJobType('MACHINING')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    selectedJobType === 'MACHINING'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Wrench className={`h-6 w-6 ${selectedJobType === 'MACHINING' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span className={`text-sm font-medium ${selectedJobType === 'MACHINING' ? 'text-purple-700' : 'text-slate-700'}`}>
                    Machining
                  </span>
                  <span className="text-xs text-slate-500">CNC, lathe, drilling</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedJobType('ASSEMBLY')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    selectedJobType === 'ASSEMBLY'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Layers className={`h-6 w-6 ${selectedJobType === 'ASSEMBLY' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className={`text-sm font-medium ${selectedJobType === 'ASSEMBLY' ? 'text-indigo-700' : 'text-slate-700'}`}>
                    Assembly
                  </span>
                  <span className="text-xs text-slate-500">Build, kit assembly</span>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedLineId || !selectedJobType || isCreating}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Job Card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
