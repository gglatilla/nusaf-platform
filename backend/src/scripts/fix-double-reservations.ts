/**
 * Data Fix Script: Remove double reservations for orders in PROCESSING status
 *
 * DO NOT RUN AUTOMATICALLY — review and execute manually.
 *
 * Problem:
 * createOrderFromQuote() creates HARD reservations with referenceType='SalesOrder',
 * then executeFulfillmentPlan() creates MORE HARD reservations with referenceType='PickingSlip'
 * or 'JobCard' for the same products. This double-counts hardReserved on StockLevel.
 *
 * Fix:
 * For each PROCESSING order, find active SalesOrder-level reservations where the same
 * product also has an active PickingSlip or JobCard reservation. Release the SalesOrder
 * reservation and decrement hardReserved.
 *
 * Usage:
 *   npx tsx src/scripts/fix-double-reservations.ts --dry-run
 *   npx tsx src/scripts/fix-double-reservations.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`=== Double Reservation Fix ${isDryRun ? '(DRY RUN)' : ''} ===\n`);

  // Find all orders that have been through fulfillment execution
  const processingOrders = await prisma.salesOrder.findMany({
    where: {
      status: {
        in: ['PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'INVOICED', 'CLOSED'],
      },
    },
    select: { id: true, orderNumber: true, status: true },
  });

  console.log(`Found ${processingOrders.length} orders in post-fulfillment statuses\n`);

  let totalReleased = 0;
  let totalHardReservedReduced = 0;

  for (const order of processingOrders) {
    // Find active SalesOrder reservations for this order
    const orderReservations = await prisma.stockReservation.findMany({
      where: {
        referenceType: 'SalesOrder',
        referenceId: order.id,
        releasedAt: null,
      },
    });

    if (orderReservations.length === 0) continue;

    // Find products that also have active fulfillment-level reservations
    const fulfillmentReservations = await prisma.stockReservation.findMany({
      where: {
        referenceType: { in: ['PickingSlip', 'JobCard'] },
        releasedAt: null,
        productId: { in: orderReservations.map(r => r.productId) },
      },
      select: { productId: true },
    });

    const fulfilledProductIds = new Set(fulfillmentReservations.map(r => r.productId));

    // Release SalesOrder reservations where fulfillment-level reservations exist
    const toRelease = orderReservations.filter(r => fulfilledProductIds.has(r.productId));

    if (toRelease.length === 0) continue;

    console.log(`Order ${order.orderNumber} (${order.status}):`);
    console.log(`  ${orderReservations.length} active SalesOrder reservations`);
    console.log(`  ${toRelease.length} have duplicate fulfillment-level reservations`);

    for (const reservation of toRelease) {
      console.log(
        `  - Product ${reservation.productId} @ ${reservation.location}: qty ${reservation.quantity}`
      );

      if (!isDryRun) {
        await prisma.$transaction(async (tx) => {
          // Release the reservation
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: {
              releasedAt: new Date(),
              releasedBy: 'system-fix-double-reservations',
              releaseReason: 'Fix: duplicate SalesOrder reservation removed (fulfillment-level reservation exists)',
            },
          });

          // Decrement hardReserved
          await tx.stockLevel.update({
            where: {
              productId_location: {
                productId: reservation.productId,
                location: reservation.location,
              },
            },
            data: {
              hardReserved: { decrement: reservation.quantity },
            },
          });
        });
      }

      totalReleased++;
      totalHardReservedReduced += reservation.quantity;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Reservations ${isDryRun ? 'to release' : 'released'}: ${totalReleased}`);
  console.log(`Total hardReserved ${isDryRun ? 'to reduce' : 'reduced'}: ${totalHardReservedReduced}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
