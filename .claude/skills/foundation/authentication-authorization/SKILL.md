---
name: authentication-authorization
description: Authentication and authorization patterns for B2B applications with multiple user types, company-based access, and role-based permissions. Use when implementing login, user management, permissions, or access control.
---

# Authentication & Authorization for B2B Applications

## Overview

B2B applications require more complex auth than consumer apps:
- Multiple user types (internal staff, customer users)
- Company-level access control
- Role-based pricing visibility
- Spending limits and approval workflows

---

## User Types

### Internal Users (Staff)

| Role | Description | Typical Permissions |
|------|-------------|---------------------|
| Admin | System administrators | Full access |
| Sales | Sales team | Quotes, customers, orders |
| Operations | Warehouse/logistics | Inventory, orders |
| Finance | Accounting team | Pricing, invoices, reports |

### External Users (Customers)

| Role | Description | Typical Permissions |
|------|-------------|---------------------|
| Company Admin | Manages company users | Full company access |
| Approver | Can approve orders | View, create, approve |
| Buyer | Creates quotes/orders | View, create |
| Viewer | Read-only access | View only |

---

## Data Model

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String?   @map("password_hash")
  
  // Profile
  firstName       String    @map("first_name")
  lastName        String    @map("last_name")
  phone           String?
  
  // User type
  userType        UserType  @default(CUSTOMER) @map("user_type")
  
  // Internal users: direct role
  internalRole    InternalRole? @map("internal_role")
  
  // External users: company membership
  companyUsers    CompanyUser[]
  
  // Auth metadata
  emailVerifiedAt DateTime? @map("email_verified_at")
  lastLoginAt     DateTime? @map("last_login_at")
  failedAttempts  Int       @default(0) @map("failed_attempts")
  lockedUntil     DateTime? @map("locked_until")
  
  // Status
  isActive        Boolean   @default(true) @map("is_active")
  
  // Audit
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")
  
  // Relations
  sessions        Session[]
  
  @@map("users")
}

enum UserType {
  INTERNAL    // Staff
  CUSTOMER    // External customer user
}

enum InternalRole {
  ADMIN
  SALES
  OPERATIONS
  FINANCE
  SUPPORT
}

model CompanyUser {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  user            User        @relation(fields: [userId], references: [id])
  companyId       String      @map("company_id")
  company         Company     @relation(fields: [companyId], references: [id])
  
  // Role within company
  role            CompanyRole @default(BUYER)
  
  // Limits
  spendingLimit   Decimal?    @map("spending_limit") @db.Decimal(12, 2)
  canApproveOrders Boolean    @default(false) @map("can_approve_orders")
  
  // Status
  isActive        Boolean     @default(true) @map("is_active")
  
  // Audit
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")
  
  @@unique([userId, companyId])
  @@map("company_users")
}

enum CompanyRole {
  VIEWER
  BUYER
  APPROVER
  ADMIN
}

model Session {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")
  user          User      @relation(fields: [userId], references: [id])
  
  token         String    @unique
  refreshToken  String?   @unique @map("refresh_token")
  
  // Context
  ipAddress     String?   @map("ip_address")
  userAgent     String?   @map("user_agent")
  
  // Expiry
  expiresAt     DateTime  @map("expires_at")
  refreshExpiresAt DateTime? @map("refresh_expires_at")
  
  // Audit
  createdAt     DateTime  @default(now()) @map("created_at")
  lastUsedAt    DateTime  @default(now()) @map("last_used_at")
  
  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}
```

---

## JWT Token Structure

```typescript
// Access token payload
interface AccessTokenPayload {
  sub: string;          // User ID
  email: string;
  userType: 'INTERNAL' | 'CUSTOMER';
  
  // For internal users
  internalRole?: InternalRole;
  
  // For customer users - active company context
  companyId?: string;
  companyRole?: CompanyRole;
  
  // Token metadata
  iat: number;
  exp: number;
}

// Refresh token payload (minimal)
interface RefreshTokenPayload {
  sub: string;
  tokenId: string;      // Session ID for revocation
  iat: number;
  exp: number;
}
```

### Token Lifetimes

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access Token | 15 minutes | Memory only |
| Refresh Token | 7 days | HttpOnly cookie |

---

## Permission System

### Permission Structure

```typescript
type Resource = 
  | 'products'
  | 'pricing'
  | 'quotes'
  | 'orders'
  | 'customers'
  | 'users'
  | 'reports'
  | 'settings';

type Action = 'view' | 'create' | 'update' | 'delete' | 'approve';

type Permission = `${Resource}:${Action}`;

// Examples: 'quotes:create', 'orders:approve', 'pricing:view'
```

### Role-Permission Mapping

```typescript
const INTERNAL_PERMISSIONS: Record<InternalRole, Permission[]> = {
  ADMIN: ['*:*'],  // All permissions
  
  SALES: [
    'products:view',
    'pricing:view',
    'quotes:*',
    'orders:view', 'orders:create',
    'customers:view', 'customers:create', 'customers:update',
    'reports:view',
  ],
  
  OPERATIONS: [
    'products:view',
    'orders:view', 'orders:update',
    'reports:view',
  ],
  
  FINANCE: [
    'products:view',
    'pricing:*',
    'quotes:view',
    'orders:view',
    'reports:*',
  ],
  
  SUPPORT: [
    'products:view',
    'quotes:view',
    'orders:view',
    'customers:view',
  ],
};

const COMPANY_PERMISSIONS: Record<CompanyRole, Permission[]> = {
  ADMIN: [
    'products:view',
    'pricing:view',
    'quotes:*',
    'orders:*',
    'users:view', 'users:create', 'users:update',  // Company users only
  ],
  
  APPROVER: [
    'products:view',
    'pricing:view',
    'quotes:view', 'quotes:create',
    'orders:view', 'orders:create', 'orders:approve',
  ],
  
  BUYER: [
    'products:view',
    'pricing:view',
    'quotes:view', 'quotes:create',
    'orders:view', 'orders:create',
  ],
  
  VIEWER: [
    'products:view',
    'pricing:view',
    'quotes:view',
    'orders:view',
  ],
};
```

---

## Implementation Patterns

### Auth Middleware

```typescript
// middleware/auth.ts
import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    userType: 'INTERNAL' | 'CUSTOMER';
    internalRole?: InternalRole;
    companyId?: string;
    companyRole?: CompanyRole;
  };
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  
  const token = authHeader.slice(7);
  
  try {
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      userType: payload.userType,
      internalRole: payload.internalRole,
      companyId: payload.companyId,
      companyRole: payload.companyRole,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

### Permission Middleware

```typescript
// middleware/authorize.ts
import { Permission, hasPermission } from '../lib/permissions';

export function authorize(...requiredPermissions: Permission[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { user } = req;
    
    const userPermissions = user.userType === 'INTERNAL'
      ? INTERNAL_PERMISSIONS[user.internalRole!]
      : COMPANY_PERMISSIONS[user.companyRole!];
    
    const hasAll = requiredPermissions.every(
      perm => hasPermission(userPermissions, perm)
    );
    
    if (!hasAll) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Usage in routes
router.post(
  '/quotes',
  authenticate,
  authorize('quotes:create'),
  createQuoteHandler
);
```

### Company Scope Middleware

```typescript
// middleware/companyScope.ts
// Ensures customer users can only access their own company's data

export function enforceCompanyScope(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const { user } = req;
  
  // Internal users can access any company
  if (user.userType === 'INTERNAL') {
    return next();
  }
  
  // Customer users must have company context
  if (!user.companyId) {
    return res.status(403).json({ error: 'No company context' });
  }
  
  // Add company filter to request for use in handlers
  req.companyScope = user.companyId;
  
  next();
}
```

---

## Authentication Flows

### Login Flow

```typescript
// services/auth.service.ts
async function login(email: string, password: string): Promise<AuthResult> {
  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email, deletedAt: null },
    include: { companyUsers: { include: { company: true } } },
  });
  
  if (!user || !user.isActive) {
    throw new AuthError('Invalid credentials');
  }
  
  // 2. Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AuthError('Account temporarily locked');
  }
  
  // 3. Verify password
  const valid = await verifyPassword(password, user.passwordHash);
  
  if (!valid) {
    // Increment failed attempts
    await incrementFailedAttempts(user.id);
    throw new AuthError('Invalid credentials');
  }
  
  // 4. Reset failed attempts
  await resetFailedAttempts(user.id);
  
  // 5. Determine company context (for customer users)
  let companyContext = null;
  if (user.userType === 'CUSTOMER' && user.companyUsers.length > 0) {
    // Default to first active company
    companyContext = user.companyUsers.find(cu => cu.isActive);
  }
  
  // 6. Create session
  const session = await createSession(user.id);
  
  // 7. Generate tokens
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    userType: user.userType,
    internalRole: user.internalRole,
    companyId: companyContext?.companyId,
    companyRole: companyContext?.role,
  });
  
  const refreshToken = generateRefreshToken({
    sub: user.id,
    tokenId: session.id,
  });
  
  // 8. Update last login
  await updateLastLogin(user.id);
  
  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
    companies: user.companyUsers.map(cu => ({
      id: cu.companyId,
      name: cu.company.name,
      role: cu.role,
    })),
  };
}
```

### Token Refresh Flow

```typescript
async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  // 1. Verify refresh token
  const payload = verifyRefreshToken(refreshToken);
  
  // 2. Find session
  const session = await prisma.session.findUnique({
    where: { id: payload.tokenId },
    include: { user: { include: { companyUsers: true } } },
  });
  
  if (!session || session.expiresAt < new Date()) {
    throw new AuthError('Invalid refresh token');
  }
  
  // 3. Check user still active
  if (!session.user.isActive || session.user.deletedAt) {
    throw new AuthError('User account disabled');
  }
  
  // 4. Rotate refresh token (security best practice)
  const newSession = await rotateSession(session.id);
  
  // 5. Generate new tokens
  const accessToken = generateAccessToken({
    sub: session.user.id,
    email: session.user.email,
    userType: session.user.userType,
    // ... other claims
  });
  
  const newRefreshToken = generateRefreshToken({
    sub: session.user.id,
    tokenId: newSession.id,
  });
  
  return { accessToken, refreshToken: newRefreshToken };
}
```

### Company Switch Flow

```typescript
// For users with multiple company memberships
async function switchCompany(
  userId: string,
  newCompanyId: string
): Promise<AccessToken> {
  // 1. Verify user has access to company
  const companyUser = await prisma.companyUser.findUnique({
    where: {
      userId_companyId: { userId, companyId: newCompanyId },
    },
    include: { company: true },
  });
  
  if (!companyUser || !companyUser.isActive) {
    throw new AuthError('No access to this company');
  }
  
  // 2. Generate new access token with new company context
  return generateAccessToken({
    sub: userId,
    // ... other claims
    companyId: newCompanyId,
    companyRole: companyUser.role,
  });
}
```

---

## Security Best Practices

### Password Requirements

```typescript
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  preventCommon: true,  // Check against common password list
};
```

### Brute Force Protection

```typescript
const LOCKOUT_POLICY = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000,  // 15 minutes
  resetAfter: 60 * 60 * 1000,       // 1 hour without attempts
};
```

### Session Security

- Store refresh tokens in HttpOnly, Secure, SameSite=Strict cookies
- Rotate refresh tokens on use
- Limit concurrent sessions per user
- Track session metadata (IP, user agent) for anomaly detection

---

## Frontend Integration

### Auth Context (React)

```typescript
// hooks/useAuth.ts
interface AuthContext {
  user: User | null;
  companies: CompanyAccess[];
  activeCompany: CompanyAccess | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
}
```

### Protected Routes (Next.js)

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

---

## Checklist

### Setup
- [ ] JWT secret in environment variables (min 256 bits)
- [ ] Password hashing with bcrypt or argon2
- [ ] Secure cookie configuration
- [ ] CORS configuration

### Implementation
- [ ] Login with brute force protection
- [ ] Token refresh with rotation
- [ ] Logout with session invalidation
- [ ] Password reset flow
- [ ] Email verification flow

### Security
- [ ] Rate limiting on auth endpoints
- [ ] Audit logging for auth events
- [ ] Session timeout handling
- [ ] Concurrent session limits
