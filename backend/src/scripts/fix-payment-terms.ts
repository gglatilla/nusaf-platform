/**
 * Data Fix Script: Set payment terms on existing companies and orders
 *
 * DO NOT RUN AUTOMATICALLY — review and execute manually.
 *
 * What this does:
 * 1. Sets all existing companies to paymentTerms = 'NET_30' (safe default — majority are on account)
 * 2. Sets all existing sales orders to paymentTerms = 'NET_30' and paymentStatus = 'NOT_REQUIRED'
 *
 * Usage:
 *   npx tsx src/scripts/fix-payment-terms.ts
 *
 * Or dry-run first:
 *   npx tsx src/scripts/fix-payment-terms.ts --dry-run
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`=== Payment Terms Data Fix ${isDryRun ? '(DRY RUN)' : ''} ===\n`);

  // 1. Fix companies — set all to NET_30
  const totalCompanies = await prisma.company.count();
  console.log(`Companies total: ${totalCompanies}`);

  if (!isDryRun) {
    const result = await prisma.company.updateMany({
      data: { paymentTerms: 'NET_30' },
    });
    console.log(`  Updated ${result.count} companies to NET_30`);
  } else {
    console.log(`  Would update ${totalCompanies} companies to NET_30`);
  }

  // 2. Fix sales orders — set all to NET_30 + NOT_REQUIRED
  const totalOrders = await prisma.salesOrder.count();
  const unpaidOrders = await prisma.salesOrder.count({
    where: { paymentStatus: 'UNPAID' },
  });
  const paidOrders = await prisma.salesOrder.count({
    where: { paymentStatus: 'PAID' },
  });
  const partialOrders = await prisma.salesOrder.count({
    where: { paymentStatus: 'PARTIALLY_PAID' },
  });

  console.log(`\nSales orders total: ${totalOrders}`);
  console.log(`  UNPAID: ${unpaidOrders}`);
  console.log(`  PARTIALLY_PAID: ${partialOrders}`);
  console.log(`  PAID: ${paidOrders}`);

  if (!isDryRun) {
    // Set paymentTerms to NET_30 for all orders
    const termsResult = await prisma.salesOrder.updateMany({
      data: { paymentTerms: 'NET_30' },
    });
    console.log(`  Updated ${termsResult.count} orders paymentTerms to NET_30`);

    // For UNPAID orders (which were never prepay since we had no prepay before), set to NOT_REQUIRED
    const statusResult = await prisma.salesOrder.updateMany({
      where: { paymentStatus: 'UNPAID' },
      data: { paymentStatus: 'NOT_REQUIRED' },
    });
    console.log(`  Updated ${statusResult.count} UNPAID orders to NOT_REQUIRED`);

    // Leave PAID and PARTIALLY_PAID as-is — those have actual payments recorded
  } else {
    console.log(`  Would update ${totalOrders} orders paymentTerms to NET_30`);
    console.log(`  Would update ${unpaidOrders} UNPAID orders to NOT_REQUIRED`);
    console.log(`  Would leave ${paidOrders} PAID and ${partialOrders} PARTIALLY_PAID orders as-is`);
  }

  console.log('\n=== Done ===');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
