/**
 * Fix script: Recalculate onOrder for all products based on SENT/ACKNOWLEDGED POs
 *
 * This script corrects onOrder values that were never incremented when POs were sent.
 * It calculates: for each product+location, sum(quantityOrdered - quantityReceived)
 * across all POs in SENT or ACKNOWLEDGED status.
 *
 * Usage: npx tsx backend/src/scripts/fix-onorder.ts
 * DO NOT run in production without reviewing the output first.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOnOrder() {
  console.log('=== Fix onOrder Script ===');
  console.log('Scanning SENT and ACKNOWLEDGED POs...\n');

  // Find all POs in SENT or ACKNOWLEDGED status with their lines
  const activePOs = await prisma.purchaseOrder.findMany({
    where: {
      status: { in: ['SENT', 'ACKNOWLEDGED'] },
    },
    include: {
      lines: true,
    },
  });

  console.log(`Found ${activePOs.length} active POs (SENT/ACKNOWLEDGED)\n`);

  // Aggregate expected onOrder by product+location
  const expectedOnOrder: Record<string, { productId: string; location: string; onOrder: number }> = {};

  for (const po of activePOs) {
    for (const line of po.lines) {
      const unreceived = line.quantityOrdered - line.quantityReceived;
      if (unreceived > 0) {
        const key = `${line.productId}:${po.deliveryLocation}`;
        if (!expectedOnOrder[key]) {
          expectedOnOrder[key] = {
            productId: line.productId,
            location: po.deliveryLocation,
            onOrder: 0,
          };
        }
        expectedOnOrder[key].onOrder += unreceived;
      }
    }
  }

  const entries = Object.values(expectedOnOrder);
  console.log(`${entries.length} product+location combinations need onOrder updates\n`);

  // Compare with current stock levels and fix
  let updated = 0;
  let skipped = 0;

  for (const entry of entries) {
    const stockLevel = await prisma.stockLevel.findUnique({
      where: {
        productId_location: {
          productId: entry.productId,
          location: entry.location as 'JHB' | 'CT',
        },
      },
    });

    if (!stockLevel) {
      console.log(`  SKIP: No stock level for product ${entry.productId} at ${entry.location}`);
      skipped++;
      continue;
    }

    if (stockLevel.onOrder === entry.onOrder) {
      console.log(`  OK: Product ${entry.productId} at ${entry.location} already correct (onOrder=${entry.onOrder})`);
      skipped++;
      continue;
    }

    console.log(
      `  FIX: Product ${entry.productId} at ${entry.location}: ` +
      `current onOrder=${stockLevel.onOrder} → correct onOrder=${entry.onOrder}`
    );

    await prisma.stockLevel.update({
      where: { id: stockLevel.id },
      data: {
        onOrder: entry.onOrder,
        updatedBy: 'system-fix-onorder',
      },
    });

    updated++;
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already correct or no stock level): ${skipped}`);
  console.log('Done.');

  await prisma.$disconnect();
}

fixOnOrder().catch((err) => {
  console.error('Script failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
