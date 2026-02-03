// Fulfillment orchestration types

import type { Warehouse, FulfillmentPolicy, JobType } from '@nusaf/shared';

export interface PickingSlipPlanLine {
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityToPick: number;
}

export interface PickingSlipPlan {
  warehouse: Warehouse;
  lines: PickingSlipPlanLine[];
  isTransferSource: boolean;
}

export interface JobCardComponentPlan {
  productId: string;
  productSku: string;
  productDescription: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortfall: number;
  sourceWarehouse: Warehouse;
}

export interface ComponentAvailability {
  allComponentsAvailable: boolean;
  componentsWithShortfall: Array<{
    productId: string;
    productSku: string;
    productDescription: string;
    requiredQuantity: number;
    availableQuantity: number;
    shortfall: number;
    supplierId: string | null;
    supplierName: string | null;
  }>;
}

export interface JobCardPlan {
  orderLineId: string;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  jobType: JobType;
  componentAvailability: ComponentAvailability;
}

export interface TransferPlan {
  fromWarehouse: Warehouse;
  toWarehouse: Warehouse;
  lines: Array<{
    orderLineId: string;
    productId: string;
    productSku: string;
    productDescription: string;
    quantityToTransfer: number;
  }>;
}

export interface OrchestrationPlan {
  orderId: string;
  orderNumber: string;
  policy: FulfillmentPolicy;
  canProceed: boolean;
  blockingReasons: string[];
  pickingSlips: PickingSlipPlan[];
  jobCards: JobCardPlan[];
  transfers: TransferPlan[];
  summary: {
    totalLines: number;
    fullyAvailable: number;
    requiresAssembly: number;
    requiresTransfer: number;
    requiresPurchase: number;
  };
}

export interface OrchestrationExecuteResult {
  pickingSlipsCreated: number;
  jobCardsCreated: number;
  transferRequestsCreated: number;
  reservationsCreated: number;
  orderStatusUpdated: string;
}

export interface GenerateFulfillmentPlanData {
  policyOverride?: FulfillmentPolicy;
}

export interface ExecuteFulfillmentPlanData {
  plan: OrchestrationPlan;
}
