import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';
import type { UserRole } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  companyId: string;
}

export interface RefreshTokenPayload {
  sub: string; // User ID
  sessionId: string;
}

/**
 * Generate an access token (short-lived)
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.accessTokenExpiry as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Generate a refresh token (long-lived)
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.refreshTokenExpiry as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload & JwtPayload {
  return jwt.verify(token, config.jwtSecret) as AccessTokenPayload & JwtPayload;
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload & JwtPayload {
  return jwt.verify(token, config.jwtSecret) as RefreshTokenPayload & JwtPayload;
}

/**
 * Calculate expiry date from JWT expiry string
 */
export function getExpiryDate(expiry: string): Date {
  const now = new Date();
  const match = expiry.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return new Date(now.getTime() + value * 1000);
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}
