import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import { loginSchema, refreshSchema } from '../../../utils/validation/auth';
import {
  login,
  refreshTokens,
  logout,
  getUserById,
  AuthError,
} from '../../../services/auth.service';
import { authenticate, AuthenticatedRequest } from '../../../middleware/auth';

const router = Router();

/**
 * GET /api/v1/auth
 * Health check for auth routes (diagnostic)
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Auth routes are working',
      routes: ['POST /login', 'POST /refresh', 'POST /logout', 'GET /me'],
    },
  });
});

/**
 * POST /api/v1/auth/login
 * Authenticate a user and return tokens
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const data = loginSchema.parse(req.body);

    // Get client info for session tracking
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Perform login
    const result = await login(data.email, data.password, ipAddress, userAgent);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validate input
    const data = refreshSchema.parse(req.body);

    // Perform token refresh
    const tokens = await refreshTokens(data.refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    console.error('Refresh error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Invalidate the current session
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Get session ID from token (we'd need to track this)
    // For now, we'll clear all sessions for the user - simplified approach
    await logout(authReq.user.id);

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get the current authenticated user
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = await getUserById(authReq.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

export default router;
