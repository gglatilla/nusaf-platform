'use client';

import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import { useFulfillmentDashboard } from '@/hooks/useFulfillment';
import {
  FulfillmentSummaryBar,
  PickingQueueSection,
  JobsInProgressSection,
  PendingTransfersSection,
  AwaitingDeliverySection,
  ReadyToShipSection,
  ExceptionAlertsSection,
} from '@/components/fulfillment/dashboard';

type SectionKey = 'picking' | 'jobs' | 'transfers' | 'delivery' | 'readyToShip' | 'exceptions';

/**
 * Determine the order of dashboard sections based on user role.
 * Each role sees their most relevant sections first.
 */
function getSectionOrder(role: string | undefined): SectionKey[] {
  switch (role) {
    case 'WAREHOUSE':
      return ['picking', 'jobs', 'transfers', 'delivery', 'readyToShip', 'exceptions'];
    case 'PURCHASER':
      return ['delivery', 'picking', 'transfers', 'jobs', 'readyToShip', 'exceptions'];
    case 'SALES':
      return ['readyToShip', 'picking', 'jobs', 'transfers', 'delivery', 'exceptions'];
    default: // ADMIN, MANAGER
      return ['exceptions', 'readyToShip', 'picking', 'jobs', 'transfers', 'delivery'];
  }
}

export default function FulfillmentDashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useFulfillmentDashboard();

  const sectionOrder = useMemo(() => getSectionOrder(user?.role), [user?.role]);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Fulfillment Dashboard"
          description="Operations overview across all fulfillment activities"
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader
          title="Fulfillment Dashboard"
          description="Operations overview across all fulfillment activities"
        />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            Failed to load fulfillment dashboard. Please try again.
          </div>
        </div>
      </>
    );
  }

  const sectionComponents: Record<SectionKey, React.ReactNode> = {
    picking: <PickingQueueSection key="picking" data={data.pickingQueue} />,
    jobs: <JobsInProgressSection key="jobs" data={data.jobCards} />,
    transfers: <PendingTransfersSection key="transfers" data={data.transfers} />,
    delivery: <AwaitingDeliverySection key="delivery" data={data.awaitingDelivery} />,
    readyToShip: <ReadyToShipSection key="readyToShip" data={data.readyToShip} />,
    exceptions: <ExceptionAlertsSection key="exceptions" data={data.exceptions} />,
  };

  return (
    <>
      <PageHeader
        title="Fulfillment Dashboard"
        description="Operations overview across all fulfillment activities"
      />

      <div className="p-4 sm:p-6 xl:p-8 space-y-6">
        {/* Summary counts */}
        <FulfillmentSummaryBar data={data} />

        {/* Section cards — ordered by role */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sectionOrder.map((key) => sectionComponents[key])}
        </div>
      </div>
    </>
  );
}
