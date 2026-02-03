import { prisma } from '../config/database';
import { config } from '../config';
import { verifyPassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getExpiryDate,
} from '../utils/jwt';
import type { User, Company } from '@prisma/client';

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string = 'AUTH_ERROR',
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    company: {
      id: string;
      name: string;
      tier: string;
    };
  };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authenticate a user and create a session
 */
export async function login(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user || !user.isActive) {
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  // 2. Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    throw new AuthError(
      `Account locked. Try again in ${minutesLeft} minutes.`,
      'ACCOUNT_LOCKED',
      423
    );
  }

  // 3. Verify password
  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    await incrementFailedAttempts(user.id);
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  // 4. Reset failed attempts on successful login
  await resetFailedAttempts(user.id);

  // 5. Create session
  const session = await createSession(user.id, ipAddress, userAgent);

  // 6. Generate tokens
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  const refreshToken = generateRefreshToken({
    sub: user.id,
    sessionId: session.id,
    tokenVersion: 1, // Initial token version
  });

  // 7. Store refresh token in session
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken,
      refreshExpiresAt: getExpiryDate(config.refreshTokenExpiry),
    },
  });

  // 8. Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user, user.company),
  };
}

/**
 * Refresh tokens using a valid refresh token
 * Implements secure token rotation with reuse detection
 */
export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  // 1. Verify refresh token signature
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  // 2. Find session (including revoked sessions for reuse detection)
  const session = await prisma.session.findFirst({
    where: {
      id: payload.sessionId,
    },
    include: {
      user: {
        include: { company: true },
      },
    },
  });

  if (!session) {
    throw new AuthError('Session not found', 'SESSION_NOT_FOUND');
  }

  // 3. Check if session was revoked (indicates potential token theft)
  if (session.revokedAt) {
    // Session was already revoked - this could be a replay attack
    // Log this security event
    console.error(
      `[SECURITY] Attempted refresh on revoked session: ${session.id}, user: ${session.userId}, reason: ${session.revokedReason}`
    );
    throw new AuthError('Session has been revoked', 'SESSION_REVOKED', 401);
  }

  // 4. Check token version - detect refresh token reuse
  // If the token version in the JWT doesn't match the session, it means
  // someone is trying to use an old (rotated) refresh token
  const tokenVersion = payload.tokenVersion ?? 1; // Default for old tokens
  if (tokenVersion !== session.tokenVersion) {
    // TOKEN REUSE DETECTED - This is a security incident!
    // Someone is using an old refresh token after it was rotated.
    // This could indicate the token was stolen. Revoke the entire session.
    console.error(
      `[SECURITY] Token reuse detected! Session: ${session.id}, User: ${session.userId}, ` +
      `Expected version: ${session.tokenVersion}, Got: ${tokenVersion}`
    );

    // Revoke the session to protect the user
    await prisma.session.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        revokedReason: `Token reuse detected (version mismatch: expected ${session.tokenVersion}, got ${tokenVersion})`,
      },
    });

    throw new AuthError(
      'Refresh token has already been used. Session revoked for security.',
      'TOKEN_REUSE_DETECTED',
      401
    );
  }

  // 5. Check if refresh token has expired
  if (session.refreshExpiresAt && session.refreshExpiresAt < new Date()) {
    throw new AuthError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
  }

  // 6. Verify the refresh token matches (belt and suspenders)
  if (session.refreshToken !== refreshToken) {
    throw new AuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  // 7. Check user still active
  if (!session.user.isActive) {
    throw new AuthError('User account disabled', 'ACCOUNT_DISABLED', 403);
  }

  // 8. Generate new tokens with incremented version
  const newTokenVersion = session.tokenVersion + 1;

  const newAccessToken = generateAccessToken({
    sub: session.user.id,
    email: session.user.email,
    role: session.user.role,
    companyId: session.user.companyId,
  });

  const newRefreshToken = generateRefreshToken({
    sub: session.user.id,
    sessionId: session.id,
    tokenVersion: newTokenVersion,
  });

  // 9. Update session with new token version and refresh token
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
      tokenVersion: newTokenVersion,
      refreshExpiresAt: getExpiryDate(config.refreshTokenExpiry),
      lastUsedAt: new Date(),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Logout by revoking the session
 * We revoke instead of delete to maintain audit trail and detect reuse attacks
 */
export async function logout(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      revokedAt: new Date(),
      revokedReason: 'User logout',
    },
  }).catch(() => {
    // Session might not exist, that's OK
  });
}

/**
 * Logout all sessions for a user
 */
export async function logoutAll(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null, // Only revoke active sessions
    },
    data: {
      revokedAt: new Date(),
      revokedReason: 'User logout all sessions',
    },
  });
}

/**
 * Revoke a session with a specific reason (for security events)
 */
export async function revokeSession(
  sessionId: string,
  reason: string
): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  }).catch(() => {
    // Session might not exist
  });
}

/**
 * Revoke all sessions for a user (for security events like password change)
 */
export async function revokeAllUserSessions(
  userId: string,
  reason: string
): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
  return result.count;
}

/**
 * Get user by ID with company
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return sanitizeUser(user, user.company);
}

// Private helpers

async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Generate a unique token for the session
  const token = generateAccessToken({
    sub: userId,
    email: '',
    role: 'CUSTOMER',
    companyId: '',
  });

  return prisma.session.create({
    data: {
      userId,
      token,
      expiresAt: getExpiryDate(config.accessTokenExpiry),
      ipAddress,
      userAgent,
    },
  });
}

async function incrementFailedAttempts(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedAttempts: true },
  });

  const newAttempts = (user?.failedAttempts || 0) + 1;
  const shouldLock = newAttempts >= config.maxLoginAttempts;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedAttempts: newAttempts,
      lockedUntil: shouldLock
        ? new Date(Date.now() + config.lockoutDuration)
        : null,
    },
  });
}

async function resetFailedAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
    },
  });
}

function sanitizeUser(user: User, company: Company) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    primaryWarehouse: user.primaryWarehouse,
    company: {
      id: company.id,
      name: company.name,
      tier: company.tier,
      primaryWarehouse: company.primaryWarehouse,
    },
  };
}
