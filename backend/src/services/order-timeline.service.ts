import { prisma } from '../config/database';

/**
 * Timeline event types for Sales Order activity log
 */
export type TimelineEventType =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_READY_TO_SHIP'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_ON_HOLD'
  | 'ORDER_HOLD_RELEASED'
  | 'ORDER_CANCELLED'
  | 'PICKING_SLIP_CREATED'
  | 'PICKING_SLIP_STARTED'
  | 'PICKING_SLIP_COMPLETED'
  | 'JOB_CARD_CREATED'
  | 'JOB_CARD_STARTED'
  | 'JOB_CARD_ON_HOLD'
  | 'JOB_CARD_COMPLETED'
  | 'TRANSFER_CREATED'
  | 'TRANSFER_SHIPPED'
  | 'TRANSFER_RECEIVED'
  | 'DELIVERY_NOTE_CREATED'
  | 'DELIVERY_NOTE_DISPATCHED'
  | 'DELIVERY_NOTE_DELIVERED'
  | 'FULFILLMENT_PLAN_EXECUTED';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: TimelineEventType;
  title: string;
  description: string | null;
  actor: string | null;
  documentType: string | null;
  documentId: string | null;
  documentNumber: string | null;
}

/**
 * Build a timeline of all activity for a sales order by aggregating
 * events from the order itself and all related documents (picking slips,
 * job cards, transfer requests).
 */
export async function getOrderTimeline(
  orderId: string,
  companyId: string
): Promise<TimelineEvent[]> {
  // Verify order exists and belongs to company
  const order = await prisma.salesOrder.findFirst({
    where: { id: orderId, companyId, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      createdBy: true,
      confirmedAt: true,
      confirmedBy: true,
      shippedDate: true,
      deliveredDate: true,
      holdReason: true,
      cancelReason: true,
      updatedAt: true,
      updatedBy: true,
    },
  });

  if (!order) {
    return [];
  }

  // Phase 1: Fetch all related documents in parallel
  const [pickingSlips, jobCards, transferRequests, deliveryNotes] = await Promise.all([
    prisma.pickingSlip.findMany({
      where: { orderId, companyId },
      select: {
        id: true,
        pickingSlipNumber: true,
        location: true,
        status: true,
        assignedToName: true,
        createdAt: true,
        createdBy: true,
        startedAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.jobCard.findMany({
      where: { orderId, companyId },
      select: {
        id: true,
        jobCardNumber: true,
        jobType: true,
        productSku: true,
        productDescription: true,
        quantity: true,
        status: true,
        holdReason: true,
        assignedToName: true,
        createdAt: true,
        createdBy: true,
        startedAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.transferRequest.findMany({
      where: { orderId, companyId },
      select: {
        id: true,
        transferNumber: true,
        fromLocation: true,
        toLocation: true,
        status: true,
        shippedAt: true,
        shippedByName: true,
        receivedAt: true,
        receivedByName: true,
        createdAt: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.deliveryNote.findMany({
      where: { orderId, companyId },
      select: {
        id: true,
        deliveryNoteNumber: true,
        location: true,
        status: true,
        createdAt: true,
        createdBy: true,
        dispatchedAt: true,
        dispatchedByName: true,
        deliveredAt: true,
        deliveredByName: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Phase 2: Resolve user names from all createdBy IDs
  const allUserIds = [
    order.createdBy,
    order.confirmedBy,
    order.updatedBy,
    ...pickingSlips.map((ps) => ps.createdBy),
    ...jobCards.map((jc) => jc.createdBy),
    ...transferRequests.map((tr) => tr.createdBy),
    ...deliveryNotes.map((dn) => dn.createdBy),
  ].filter((id): id is string => id !== null && id !== undefined);

  const uniqueUserIds = [...new Set(allUserIds)];
  const users = uniqueUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: uniqueUserIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];

  // Build user lookup map
  const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
  const getUserName = (id: string | null): string | null => {
    if (!id) return null;
    return userMap.get(id) ?? null;
  };

  const events: TimelineEvent[] = [];

  // --- Order lifecycle events ---

  // Created
  events.push({
    id: `order-created-${order.id}`,
    timestamp: order.createdAt.toISOString(),
    type: 'ORDER_CREATED',
    title: 'Order created',
    description: null,
    actor: getUserName(order.createdBy),
    documentType: null,
    documentId: null,
    documentNumber: null,
  });

  // Confirmed
  if (order.confirmedAt) {
    events.push({
      id: `order-confirmed-${order.id}`,
      timestamp: order.confirmedAt.toISOString(),
      type: 'ORDER_CONFIRMED',
      title: 'Order confirmed',
      description: null,
      actor: getUserName(order.confirmedBy),
      documentType: null,
      documentId: null,
      documentNumber: null,
    });
  }

  // Shipped
  if (order.shippedDate) {
    events.push({
      id: `order-shipped-${order.id}`,
      timestamp: order.shippedDate.toISOString(),
      type: 'ORDER_SHIPPED',
      title: 'Order shipped',
      description: null,
      actor: null,
      documentType: null,
      documentId: null,
      documentNumber: null,
    });
  }

  // Delivered
  if (order.deliveredDate) {
    events.push({
      id: `order-delivered-${order.id}`,
      timestamp: order.deliveredDate.toISOString(),
      type: 'ORDER_DELIVERED',
      title: 'Order delivered',
      description: null,
      actor: null,
      documentType: null,
      documentId: null,
      documentNumber: null,
    });
  }

  // On hold
  if (order.status === 'ON_HOLD' && order.holdReason) {
    events.push({
      id: `order-hold-${order.id}`,
      timestamp: order.updatedAt.toISOString(),
      type: 'ORDER_ON_HOLD',
      title: 'Order put on hold',
      description: order.holdReason,
      actor: getUserName(order.updatedBy),
      documentType: null,
      documentId: null,
      documentNumber: null,
    });
  }

  // Cancelled
  if (order.status === 'CANCELLED' && order.cancelReason) {
    events.push({
      id: `order-cancelled-${order.id}`,
      timestamp: order.updatedAt.toISOString(),
      type: 'ORDER_CANCELLED',
      title: 'Order cancelled',
      description: order.cancelReason,
      actor: getUserName(order.updatedBy),
      documentType: null,
      documentId: null,
      documentNumber: null,
    });
  }

  // --- Picking slip events ---
  for (const ps of pickingSlips) {
    const locationLabel = ps.location === 'JHB' ? 'Johannesburg' : 'Cape Town';

    events.push({
      id: `ps-created-${ps.id}`,
      timestamp: ps.createdAt.toISOString(),
      type: 'PICKING_SLIP_CREATED',
      title: `Picking slip created`,
      description: `${ps.pickingSlipNumber} — ${locationLabel}`,
      actor: getUserName(ps.createdBy),
      documentType: 'PickingSlip',
      documentId: ps.id,
      documentNumber: ps.pickingSlipNumber,
    });

    if (ps.startedAt) {
      events.push({
        id: `ps-started-${ps.id}`,
        timestamp: ps.startedAt.toISOString(),
        type: 'PICKING_SLIP_STARTED',
        title: `Picking started`,
        description: `${ps.pickingSlipNumber}`,
        actor: ps.assignedToName,
        documentType: 'PickingSlip',
        documentId: ps.id,
        documentNumber: ps.pickingSlipNumber,
      });
    }

    if (ps.completedAt) {
      events.push({
        id: `ps-completed-${ps.id}`,
        timestamp: ps.completedAt.toISOString(),
        type: 'PICKING_SLIP_COMPLETED',
        title: `Picking completed`,
        description: `${ps.pickingSlipNumber}`,
        actor: ps.assignedToName,
        documentType: 'PickingSlip',
        documentId: ps.id,
        documentNumber: ps.pickingSlipNumber,
      });
    }
  }

  // --- Job card events ---
  for (const jc of jobCards) {
    const jobTypeLabel = jc.jobType === 'MACHINING' ? 'Machining' : 'Assembly';

    events.push({
      id: `jc-created-${jc.id}`,
      timestamp: jc.createdAt.toISOString(),
      type: 'JOB_CARD_CREATED',
      title: `Job card created`,
      description: `${jc.jobCardNumber} — ${jobTypeLabel}: ${jc.productSku} x${jc.quantity}`,
      actor: getUserName(jc.createdBy),
      documentType: 'JobCard',
      documentId: jc.id,
      documentNumber: jc.jobCardNumber,
    });

    if (jc.startedAt) {
      events.push({
        id: `jc-started-${jc.id}`,
        timestamp: jc.startedAt.toISOString(),
        type: 'JOB_CARD_STARTED',
        title: `Job started`,
        description: `${jc.jobCardNumber}`,
        actor: jc.assignedToName,
        documentType: 'JobCard',
        documentId: jc.id,
        documentNumber: jc.jobCardNumber,
      });
    }

    if (jc.status === 'ON_HOLD' && jc.holdReason) {
      events.push({
        id: `jc-hold-${jc.id}`,
        timestamp: jc.createdAt.toISOString(), // best approximation
        type: 'JOB_CARD_ON_HOLD',
        title: `Job put on hold`,
        description: `${jc.jobCardNumber} — ${jc.holdReason}`,
        actor: jc.assignedToName,
        documentType: 'JobCard',
        documentId: jc.id,
        documentNumber: jc.jobCardNumber,
      });
    }

    if (jc.completedAt) {
      events.push({
        id: `jc-completed-${jc.id}`,
        timestamp: jc.completedAt.toISOString(),
        type: 'JOB_CARD_COMPLETED',
        title: `Job completed`,
        description: `${jc.jobCardNumber}`,
        actor: jc.assignedToName,
        documentType: 'JobCard',
        documentId: jc.id,
        documentNumber: jc.jobCardNumber,
      });
    }
  }

  // --- Transfer request events ---
  for (const tr of transferRequests) {
    const fromLabel = tr.fromLocation === 'JHB' ? 'Johannesburg' : 'Cape Town';
    const toLabel = tr.toLocation === 'JHB' ? 'Johannesburg' : 'Cape Town';

    events.push({
      id: `tr-created-${tr.id}`,
      timestamp: tr.createdAt.toISOString(),
      type: 'TRANSFER_CREATED',
      title: `Transfer request created`,
      description: `${tr.transferNumber} — ${fromLabel} → ${toLabel}`,
      actor: getUserName(tr.createdBy),
      documentType: 'TransferRequest',
      documentId: tr.id,
      documentNumber: tr.transferNumber,
    });

    if (tr.shippedAt) {
      events.push({
        id: `tr-shipped-${tr.id}`,
        timestamp: tr.shippedAt.toISOString(),
        type: 'TRANSFER_SHIPPED',
        title: `Transfer shipped`,
        description: `${tr.transferNumber} — ${fromLabel} → ${toLabel}`,
        actor: tr.shippedByName,
        documentType: 'TransferRequest',
        documentId: tr.id,
        documentNumber: tr.transferNumber,
      });
    }

    if (tr.receivedAt) {
      events.push({
        id: `tr-received-${tr.id}`,
        timestamp: tr.receivedAt.toISOString(),
        type: 'TRANSFER_RECEIVED',
        title: `Transfer received`,
        description: `${tr.transferNumber} — ${toLabel}`,
        actor: tr.receivedByName,
        documentType: 'TransferRequest',
        documentId: tr.id,
        documentNumber: tr.transferNumber,
      });
    }
  }

  // --- Delivery note events ---
  for (const dn of deliveryNotes) {
    const locationLabel = dn.location === 'JHB' ? 'Johannesburg' : 'Cape Town';

    events.push({
      id: `dn-created-${dn.id}`,
      timestamp: dn.createdAt.toISOString(),
      type: 'DELIVERY_NOTE_CREATED',
      title: `Delivery note created`,
      description: `${dn.deliveryNoteNumber} — ${locationLabel}`,
      actor: getUserName(dn.createdBy),
      documentType: 'DeliveryNote',
      documentId: dn.id,
      documentNumber: dn.deliveryNoteNumber,
    });

    if (dn.dispatchedAt) {
      events.push({
        id: `dn-dispatched-${dn.id}`,
        timestamp: dn.dispatchedAt.toISOString(),
        type: 'DELIVERY_NOTE_DISPATCHED',
        title: `Goods dispatched`,
        description: `${dn.deliveryNoteNumber} — ${locationLabel}`,
        actor: dn.dispatchedByName,
        documentType: 'DeliveryNote',
        documentId: dn.id,
        documentNumber: dn.deliveryNoteNumber,
      });
    }

    if (dn.deliveredAt) {
      events.push({
        id: `dn-delivered-${dn.id}`,
        timestamp: dn.deliveredAt.toISOString(),
        type: 'DELIVERY_NOTE_DELIVERED',
        title: `Delivery confirmed`,
        description: `${dn.deliveryNoteNumber} — received by ${dn.deliveredByName || 'unknown'}`,
        actor: dn.deliveredByName,
        documentType: 'DeliveryNote',
        documentId: dn.id,
        documentNumber: dn.deliveryNoteNumber,
      });
    }
  }

  // Sort all events chronologically (newest first for display)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events;
}
