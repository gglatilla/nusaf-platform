import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  calculateProductPrice,
  calculateCustomerPrice,
  recalculateProductPrices,
} from '../../../services/pricing.service';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/products/:id/price
 * Get calculated price for a product (requires authentication)
 */
router.get('/:id/price', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Get product
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    // Get company tier for pricing
    const company = await prisma.company.findUnique({
      where: { id: authReq.user.companyId },
    });

    if (!company) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User company not found' },
      });
    }

    // If product has list price, use it; otherwise calculate
    let listPrice: number;
    let calculated = false;

    if (product.listPrice) {
      listPrice = Number(product.listPrice);
    } else if (product.costPrice) {
      // Calculate on the fly
      const result = await calculateProductPrice(id);
      if (!result.success || !result.listPrice) {
        return res.status(400).json({
          success: false,
          error: { code: 'PRICE_ERROR', message: result.error || 'Cannot calculate price' },
        });
      }
      listPrice = result.listPrice;
      calculated = true;
    } else {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_PRICE', message: 'Product has no cost price set' },
      });
    }

    // Calculate customer price based on tier
    const customerPrice = calculateCustomerPrice(listPrice, company.tier);

    return res.json({
      success: true,
      data: {
        productId: product.id,
        nusafSku: product.nusafSku,
        listPrice,
        customerPrice,
        tier: company.tier,
        currency: 'ZAR',
        calculated,
        priceUpdatedAt: product.priceUpdatedAt,
      },
    });
  } catch (error) {
    console.error('Get product price error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRICE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get product price',
      },
    });
  }
});

/**
 * POST /api/v1/products/recalculate
 * Recalculate and save list prices for products (admin only)
 */
router.post(
  '/recalculate',
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { supplierId, categoryId } = req.body;

      const result = await recalculateProductPrices({
        supplierId: typeof supplierId === 'string' ? supplierId : undefined,
        categoryId: typeof categoryId === 'string' ? categoryId : undefined,
        userId: authReq.user.id,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Recalculate prices error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'RECALCULATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to recalculate prices',
        },
      });
    }
  }
);

export default router;
