'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, AlertCircle, ClipboardList, Wrench, Truck, ShoppingCart } from 'lucide-react';
import { useGenerateFulfillmentPlan, useExecuteFulfillmentPlan } from '@/hooks/useFulfillment';
import { FulfillmentPlanSummary } from './FulfillmentPlanSummary';
import { FulfillmentPolicySelector } from './FulfillmentPolicySelector';
import { PlanSection } from './PlanSection';
import { PickingSlipPlanSection } from './PickingSlipPlanSection';
import { JobCardPlanSection } from './JobCardPlanSection';
import { TransferPlanSection } from './TransferPlanSection';
import { PurchaseOrderPlanSection } from './PurchaseOrderPlanSection';
import { ExecutionResultModal } from './ExecutionResultModal';
import type { FulfillmentPolicy, OrchestrationPlan, ExecutionResult } from '@/lib/api';

interface FulfillmentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export function FulfillmentPlanModal({
  isOpen,
  onClose,
  orderId,
}: FulfillmentPlanModalProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<FulfillmentPolicy | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['pickingSlips'])
  );
  const [showResultModal, setShowResultModal] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const generatePlan = useGenerateFulfillmentPlan();
  const executePlan = useExecuteFulfillmentPlan();

  // Generate plan when modal opens
  useEffect(() => {
    if (isOpen && !generatePlan.data && !generatePlan.isPending) {
      generatePlan.mutate({ orderId });
    }
  }, [isOpen, orderId]);

  // Set selected policy from plan when it loads
  useEffect(() => {
    if (generatePlan.data && !selectedPolicy) {
      setSelectedPolicy(generatePlan.data.effectivePolicy);
    }
  }, [generatePlan.data]);

  // Handle policy change
  const handlePolicyChange = (policy: FulfillmentPolicy) => {
    setSelectedPolicy(policy);
    generatePlan.mutate({ orderId, policyOverride: policy });
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Execute the plan
  const handleExecute = async () => {
    if (!generatePlan.data) return;

    try {
      const result = await executePlan.mutateAsync({
        orderId,
        plan: generatePlan.data,
      });
      setExecutionResult(result);
      setShowResultModal(true);
    } catch (error) {
      // Error is handled by mutation state
    }
  };

  // Close result modal and main modal
  const handleResultClose = () => {
    setShowResultModal(false);
    setExecutionResult(null);
    onClose();
  };

  // Reset state when modal closes
  const handleClose = () => {
    generatePlan.reset();
    setSelectedPolicy(null);
    setExpandedSections(new Set(['pickingSlips']));
    onClose();
  };

  if (!isOpen) return null;

  const plan = generatePlan.data;
  const isLoading = generatePlan.isPending;
  const isExecuting = executePlan.isPending;
  const error = generatePlan.error || executePlan.error;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Generate Fulfillment Plan
              </h2>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
                  <p className="text-sm text-slate-600">Generating fulfillment plan...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Failed to generate plan</p>
                    <p className="text-xs mt-1">{error.message}</p>
                  </div>
                </div>
              )}

              {/* Plan Content */}
              {plan && !isLoading && (
                <>
                  {/* Summary */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <FulfillmentPlanSummary summary={plan.summary} />
                  </div>

                  {/* Policy Selector */}
                  <FulfillmentPolicySelector
                    value={selectedPolicy || plan.effectivePolicy}
                    onChange={handlePolicyChange}
                    disabled={isExecuting}
                  />

                  {/* Warnings */}
                  {plan.warnings.length > 0 && (
                    <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Warnings</p>
                          <ul className="mt-1 space-y-1">
                            {plan.warnings.map((warning, i) => (
                              <li key={i} className="text-sm text-amber-700">
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Blocked State */}
                  {!plan.canProceed && plan.blockedReason && (
                    <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Cannot Proceed</p>
                          <p className="text-sm text-red-700 mt-1">{plan.blockedReason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Document Sections */}
                  <div className="space-y-2">
                    <PlanSection
                      title="Picking Slips"
                      count={plan.pickingSlips.length}
                      icon={ClipboardList}
                      iconColor="text-indigo-500"
                      expanded={expandedSections.has('pickingSlips')}
                      onToggle={() => toggleSection('pickingSlips')}
                      emptyMessage="No picking slips to create"
                    >
                      <PickingSlipPlanSection pickingSlips={plan.pickingSlips} />
                    </PlanSection>

                    <PlanSection
                      title="Job Cards"
                      count={plan.jobCards.length}
                      icon={Wrench}
                      iconColor="text-purple-500"
                      expanded={expandedSections.has('jobCards')}
                      onToggle={() => toggleSection('jobCards')}
                      emptyMessage="No job cards to create"
                    >
                      <JobCardPlanSection jobCards={plan.jobCards} />
                    </PlanSection>

                    <PlanSection
                      title="Transfers"
                      count={plan.transfers.length}
                      icon={Truck}
                      iconColor="text-blue-500"
                      expanded={expandedSections.has('transfers')}
                      onToggle={() => toggleSection('transfers')}
                      emptyMessage="No transfers to create"
                    >
                      <TransferPlanSection transfers={plan.transfers} />
                    </PlanSection>

                    <PlanSection
                      title="Purchase Orders"
                      count={plan.purchaseOrders.length}
                      icon={ShoppingCart}
                      iconColor="text-amber-500"
                      expanded={expandedSections.has('purchaseOrders')}
                      onToggle={() => toggleSection('purchaseOrders')}
                      emptyMessage="No purchase orders to create"
                    >
                      <PurchaseOrderPlanSection purchaseOrders={plan.purchaseOrders} />
                    </PlanSection>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {plan && (
                    <span>
                      Order: <strong>{plan.orderNumber}</strong>
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isExecuting}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={!plan || !plan.canProceed || isLoading || isExecuting}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExecuting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isExecuting ? 'Executing...' : 'Execute Plan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Result Modal */}
      {showResultModal && executionResult && (
        <ExecutionResultModal
          result={executionResult}
          onClose={handleResultClose}
        />
      )}
    </>
  );
}
