/**
 * Admin Users Route — Unit Tests
 *
 * Tests the staff user create endpoint, specifically:
 * - Auto-assignment to internal company when companyId is omitted
 * - Explicit companyId still works
 * - Error when no internal company exists
 *
 * Since route handlers are inline Express handlers, we import the router
 * and test via a minimal Express app using node's built-in http.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from 'http';

// =============================================================================
// MOCK SETUP
// =============================================================================

const { mockPrisma, mockHashPassword } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
  mockHashPassword: vi.fn(),
}));

vi.mock('../../../backend/src/config/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../../backend/src/utils/password', () => ({
  hashPassword: mockHashPassword,
}));

vi.mock('../../../backend/src/middleware/auth', () => ({
  authenticate: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import express from 'express';
import route from '../../../backend/src/api/v1/admin/users/route';

// Helper: create app, make a POST request, return parsed response
async function postUser(body: Record<string, unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  const app = express();
  app.use(express.json());
  app.use('/admin/users', route);

  const server = http.createServer(app);

  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('Failed to get server address'));
        return;
      }

      const postData = JSON.stringify(body);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: addr.port,
          path: '/admin/users',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk: string) => { data += chunk; });
          res.on('end', () => {
            server.close();
            resolve({
              status: res.statusCode || 500,
              body: JSON.parse(data) as Record<string, unknown>,
            });
          });
        },
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      req.write(postData);
      req.end();
    });
  });
}

// =============================================================================
// TESTS
// =============================================================================

describe('POST /admin/users — staff user creation', () => {
  // Valid CUID-format strings that pass z.string().cuid() validation
  const internalCoId = 'clxyz0000000000000internal';
  const customCoId = 'clxyz00000000000000custom';
  const nonexistentCoId = 'clxyz000000000000noexist';

  const basePayload = {
    email: 'newstaff@nusaf.co.za',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'SALES',
  };

  const mockCreatedUser = {
    id: 'clxyz0000000000000user001',
    email: 'newstaff@nusaf.co.za',
    firstName: 'Test',
    lastName: 'User',
    role: 'SALES',
    employeeCode: null,
    primaryWarehouse: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    company: { id: internalCoId, name: 'Nusaf Dynamic Technologies' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHashPassword.mockResolvedValue('hashed-password');
    mockPrisma.user.findUnique.mockResolvedValue(null); // No duplicates
    mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
  });

  it('auto-assigns to internal company when companyId is omitted', async () => {
    mockPrisma.company.findFirst.mockResolvedValue({
      id: internalCoId,
      name: 'Nusaf Dynamic Technologies',
      isInternal: true,
    });

    const res = await postUser(basePayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify findFirst was called to look up internal company
    expect(mockPrisma.company.findFirst).toHaveBeenCalledWith({
      where: { isInternal: true },
    });

    // Verify user was created with the internal company ID
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: internalCoId,
        }),
      }),
    );
  });

  it('uses explicit companyId when provided', async () => {
    mockPrisma.company.findUnique.mockResolvedValue({
      id: customCoId,
      name: 'Custom Company',
    });

    const res = await postUser({ ...basePayload, companyId: customCoId });

    expect(res.status).toBe(201);

    // Should NOT have called findFirst for internal company
    expect(mockPrisma.company.findFirst).not.toHaveBeenCalled();

    // Should have called findUnique with the provided companyId
    expect(mockPrisma.company.findUnique).toHaveBeenCalledWith({
      where: { id: customCoId },
    });

    // User created with the explicit company
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: customCoId,
        }),
      }),
    );
  });

  it('returns 500 when no internal company exists and companyId is omitted', async () => {
    mockPrisma.company.findFirst.mockResolvedValue(null);

    const res = await postUser(basePayload);

    expect(res.status).toBe(500);
    expect((res.body.error as Record<string, unknown>).code).toBe('NO_INTERNAL_COMPANY');
  });

  it('returns 400 when explicit companyId is not found', async () => {
    mockPrisma.company.findUnique.mockResolvedValue(null);

    const res = await postUser({ ...basePayload, companyId: nonexistentCoId });

    expect(res.status).toBe(400);
    expect((res.body.error as Record<string, unknown>).code).toBe('INVALID_COMPANY');
  });
});
