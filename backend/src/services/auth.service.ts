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
 */
export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  // 1. Verify refresh token
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  // 2. Find session
  const session = await prisma.session.findFirst({
    where: {
      id: payload.sessionId,
      refreshToken,
      refreshExpiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: { company: true },
      },
    },
  });

  if (!session) {
    throw new AuthError('Session not found or expired', 'SESSION_EXPIRED');
  }

  // 3. Check user still active
  if (!session.user.isActive) {
    throw new AuthError('User account disabled', 'ACCOUNT_DISABLED', 403);
  }

  // 4. Generate new tokens
  const newAccessToken = generateAccessToken({
    sub: session.user.id,
    email: session.user.email,
    role: session.user.role,
    companyId: session.user.companyId,
  });

  const newRefreshToken = generateRefreshToken({
    sub: session.user.id,
    sessionId: session.id,
  });

  // 5. Rotate refresh token (security best practice)
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
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
 * Logout by invalidating the session
 */
export async function logout(sessionId: string): Promise<void> {
  await prisma.session.delete({
    where: { id: sessionId },
  }).catch(() => {
    // Session might already be deleted, that's OK
  });
}

/**
 * Logout all sessions for a user
 */
export async function logoutAll(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
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
    company: {
      id: company.id,
      name: company.name,
      tier: company.tier,
    },
  };
}
