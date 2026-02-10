/**
 * Reservation Cleanup Service
 *
 * Handles releasing expired soft reservations in batches.
 * Soft reservations are created when quotes are finalized (DRAFT → CREATED)
 * and should expire when the quote's validUntil date passes.
 */

import { prisma } from '../config/database';
import { updateStockLevel } from './inventory.service';

const BATCH_SIZE = 100;

export interface CleanupResult {
  releasedCount: number;
  batchesProcessed: number;
  errors: string[];
}

/**
 * Release all expired soft reservations.
 * Processes in batches of 100 to avoid long-running transactions.
 */
export async function releaseExpiredSoftReservations(userId: string): Promise<CleanupResult> {
  const result: CleanupResult = {
    releasedCount: 0,
    batchesProcessed: 0,
    errors: [],
  };

  let hasMore = true;

  while (hasMore) {
    const expired = await prisma.stockReservation.findMany({
      where: {
        reservationType: 'SOFT',
        releasedAt: null,
        expiresAt: { lt: new Date() },
      },
      take: BATCH_SIZE,
    });

    if (expired.length === 0) {
      hasMore = false;
      break;
    }

    result.batchesProcessed++;

    // Process each batch in a transaction
    try {
      await prisma.$transaction(async (tx) => {
        for (const reservation of expired) {
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: {
              releasedAt: new Date(),
              releasedBy: userId,
              releaseReason: 'Soft reservation expired',
            },
          });

          await updateStockLevel(
            tx,
            reservation.productId,
            reservation.location,
            { softReserved: -reservation.quantity },
            userId
          );

          result.releasedCount++;
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Batch ${result.batchesProcessed}: ${message}`);
      // Stop processing on error to avoid infinite loop
      hasMore = false;
    }

    // If we got less than a full batch, we're done
    if (expired.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  return result;
}
