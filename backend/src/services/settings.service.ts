import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * Global settings interface
 */
export interface GlobalSettingsData {
  eurZarRate: number;
  rateUpdatedAt: Date;
  rateUpdatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get the current global settings
 */
export async function getSettings(): Promise<GlobalSettingsData> {
  const settings = await prisma.globalSettings.findUnique({
    where: { id: 'global' },
  });

  if (!settings) {
    throw new Error('Global settings not found. Database may not be seeded.');
  }

  return {
    eurZarRate: Number(settings.eurZarRate),
    rateUpdatedAt: settings.rateUpdatedAt,
    rateUpdatedBy: settings.rateUpdatedBy,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}

/**
 * Update the EUR/ZAR exchange rate
 */
export async function updateEurZarRate(
  newRate: number,
  userId: string
): Promise<GlobalSettingsData> {
  if (newRate <= 0) {
    throw new Error('EUR/ZAR rate must be greater than 0');
  }

  if (newRate > 1000) {
    throw new Error('EUR/ZAR rate seems unreasonably high. Maximum is 1000.');
  }

  const settings = await prisma.globalSettings.update({
    where: { id: 'global' },
    data: {
      eurZarRate: new Decimal(newRate),
      rateUpdatedAt: new Date(),
      rateUpdatedBy: userId,
    },
  });

  return {
    eurZarRate: Number(settings.eurZarRate),
    rateUpdatedAt: settings.rateUpdatedAt,
    rateUpdatedBy: settings.rateUpdatedBy,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}

/**
 * Ensure global settings exist (used during app startup or seeding)
 */
export async function ensureSettingsExist(defaultRate: number = 20.5): Promise<GlobalSettingsData> {
  const existing = await prisma.globalSettings.findUnique({
    where: { id: 'global' },
  });

  if (existing) {
    return {
      eurZarRate: Number(existing.eurZarRate),
      rateUpdatedAt: existing.rateUpdatedAt,
      rateUpdatedBy: existing.rateUpdatedBy,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    };
  }

  const settings = await prisma.globalSettings.create({
    data: {
      id: 'global',
      eurZarRate: new Decimal(defaultRate),
      rateUpdatedAt: new Date(),
    },
  });

  return {
    eurZarRate: Number(settings.eurZarRate),
    rateUpdatedAt: settings.rateUpdatedAt,
    rateUpdatedBy: settings.rateUpdatedBy,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}
