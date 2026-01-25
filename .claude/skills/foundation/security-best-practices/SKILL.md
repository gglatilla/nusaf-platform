---
name: security-best-practices
description: Security best practices for B2B applications handling sensitive pricing data and customer information. Use when implementing authentication, authorization, data protection, or reviewing security.
---

# Security Best Practices for B2B Applications

## Why Security is Critical

B2B applications handle:
- **Confidential pricing** → Competitive disadvantage if leaked
- **Customer data** → POPIA compliance required (South Africa)
- **Financial data** → Invoices, payment information
- **Business intelligence** → Order history, customer patterns

---

## Security Layers

```
┌─────────────────────────────────────────┐
│           Network Security              │
│    (HTTPS, Firewall, DDoS protection)   │
├─────────────────────────────────────────┤
│         Application Security            │
│   (Auth, Input validation, CSRF, XSS)   │
├─────────────────────────────────────────┤
│            Data Security                │
│  (Encryption, Access control, Masking)  │
├─────────────────────────────────────────┤
│        Infrastructure Security          │
│   (Secrets, Logging, Monitoring)        │
└─────────────────────────────────────────┘
```

---

## Authentication Security

### Password Requirements

```typescript
const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  preventCommonPasswords: true,
  preventUserInfo: true,  // No email/name in password
};

// Use a proper library
import { zxcvbn } from 'zxcvbn';

function validatePassword(password: string, userInfo: UserInfo): ValidationResult {
  const result = zxcvbn(password, [userInfo.email, userInfo.firstName, userInfo.lastName]);
  
  if (result.score < 3) {
    return { valid: false, message: result.feedback.warning || 'Password too weak' };
  }
  
  return { valid: true };
}
```

### Password Hashing

```typescript
// ALWAYS use bcrypt or argon2
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;  // Minimum 10, prefer 12

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Brute Force Protection

```typescript
const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,  // 15 minutes
    blockDuration: 15 * 60 * 1000,
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,  // 1 hour
  },
};

// Track by IP + email combination
async function checkLoginAttempt(ip: string, email: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = `login:${ip}:${email}`;
  const attempts = await redis.get(key);
  
  if (attempts >= RATE_LIMIT_CONFIG.login.maxAttempts) {
    const ttl = await redis.ttl(key);
    return { allowed: false, retryAfter: ttl };
  }
  
  return { allowed: true };
}

async function recordFailedLogin(ip: string, email: string): Promise<void> {
  const key = `login:${ip}:${email}`;
  await redis.incr(key);
  await redis.expire(key, RATE_LIMIT_CONFIG.login.windowMs / 1000);
}
```

### Session Security

```typescript
// JWT configuration
const JWT_CONFIG = {
  accessToken: {
    expiresIn: '15m',      // Short-lived
    algorithm: 'RS256',    // Use RSA, not HS256
  },
  refreshToken: {
    expiresIn: '7d',
    algorithm: 'RS256',
  },
};

// Cookie configuration for refresh tokens
const COOKIE_CONFIG = {
  httpOnly: true,          // Not accessible via JavaScript
  secure: true,            // HTTPS only
  sameSite: 'strict',      // CSRF protection
  path: '/api/auth',       // Only sent to auth endpoints
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
```

---

## Input Validation

### Never Trust User Input

```typescript
import { z } from 'zod';

// ALWAYS validate and sanitize
const createProductSchema = z.object({
  sku: z.string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9-]+$/, 'SKU must be alphanumeric with hyphens'),
  
  name: z.string()
    .min(1)
    .max(200)
    .transform(s => sanitizeHtml(s)),  // Strip HTML
  
  description: z.string()
    .max(5000)
    .optional()
    .transform(s => s ? sanitizeHtml(s) : undefined),
  
  price: z.number()
    .positive()
    .max(999999999),  // Reasonable upper bound
  
  categoryId: z.string().uuid(),  // Validate format
});

// In route handler
async function createProduct(req: Request, res: Response) {
  const validation = createProductSchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      },
    });
  }
  
  // Use validated data only
  const product = await productService.create(validation.data);
}
```

### SQL Injection Prevention

```typescript
// ALWAYS use parameterized queries

// ❌ NEVER do this
const query = `SELECT * FROM products WHERE sku = '${sku}'`;

// ✅ Use Prisma (parameterized by default)
const product = await prisma.product.findUnique({
  where: { sku },
});

// ✅ Or raw queries with parameters
const products = await prisma.$queryRaw`
  SELECT * FROM products WHERE category = ${category}
`;
```

### XSS Prevention

```typescript
// React is safe by default, but watch for:

// ❌ Dangerous
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ Safe - use a sanitizer
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />

// ✅ Better - avoid dangerouslySetInnerHTML
<div>{userContent}</div>  // React escapes automatically
```

---

## Authorization

### Row-Level Security

```typescript
// ALWAYS filter by user's company for customer users
class QuoteRepository {
  async findById(id: string, user: AuthUser): Promise<Quote | null> {
    const where: Prisma.QuoteWhereInput = { id, deletedAt: null };
    
    // Customer users can only see their company's quotes
    if (user.userType === 'CUSTOMER') {
      where.companyId = user.companyId;
    }
    
    return prisma.quote.findFirst({ where });
  }
  
  async findAll(filters: QuoteFilters, user: AuthUser): Promise<Quote[]> {
    const where: Prisma.QuoteWhereInput = { deletedAt: null };
    
    // Enforce company scope
    if (user.userType === 'CUSTOMER') {
      where.companyId = user.companyId;
    }
    
    // Apply additional filters
    if (filters.status) {
      where.status = filters.status;
    }
    
    return prisma.quote.findMany({ where });
  }
}
```

### Pricing Visibility Rules

```typescript
// Not all users should see all pricing information
interface PriceVisibility {
  showCost: boolean;
  showMargin: boolean;
  showSupplierPrice: boolean;
  showDiscount: boolean;
}

function getPriceVisibility(user: AuthUser): PriceVisibility {
  if (user.userType === 'INTERNAL') {
    switch (user.internalRole) {
      case 'ADMIN':
      case 'FINANCE':
        return { showCost: true, showMargin: true, showSupplierPrice: true, showDiscount: true };
      case 'SALES':
        return { showCost: true, showMargin: true, showSupplierPrice: false, showDiscount: true };
      default:
        return { showCost: false, showMargin: false, showSupplierPrice: false, showDiscount: false };
    }
  }
  
  // Customer users see limited pricing
  return { showCost: false, showMargin: false, showSupplierPrice: false, showDiscount: true };
}

// Apply when serializing responses
function serializeProduct(product: Product, user: AuthUser): ProductResponse {
  const visibility = getPriceVisibility(user);
  
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    listPrice: product.listPrice,
    // Only include if authorized
    ...(visibility.showCost && { cost: product.cost }),
    ...(visibility.showMargin && { margin: calculateMargin(product) }),
  };
}
```

---

## API Security

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
});

// Stricter limit for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,  // Only count failures
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

### CORS Configuration

```typescript
import cors from 'cors';

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.nusaf.co.za',
      'https://www.nusaf.co.za',
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  maxAge: 86400,  // Cache preflight for 24 hours
};

app.use(cors(corsOptions));
```

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // For Tailwind
      imgSrc: ["'self'", 'https://assets.nusaf.co.za'],
      connectSrc: ["'self'", 'https://api.nusaf.co.za'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

## Data Protection

### Encryption at Rest

```typescript
// Database: Use encrypted storage (Railway provides this)
// Files: Cloudflare R2 encrypts at rest by default

// For sensitive fields, consider application-level encryption
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');  // 32 bytes

function encrypt(plaintext: string): { ciphertext: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  
  return {
    ciphertext,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
  };
}

function decrypt(ciphertext: string, iv: string, tag: string): string {
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  
  return plaintext;
}
```

### Encryption in Transit

```typescript
// ALWAYS use HTTPS
// Vercel and Railway provide this by default

// Force HTTPS redirect
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
});
```

### Data Masking in Logs

```typescript
// NEVER log sensitive data
const SENSITIVE_FIELDS = ['password', 'apiKey', 'token', 'creditCard', 'ssn'];

function sanitizeForLogging(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
}

// Usage
logger.info('User login attempt', sanitizeForLogging({ email, password, ip }));
// Logs: { email: 'user@example.com', password: '[REDACTED]', ip: '1.2.3.4' }
```

---

## Secrets Management

### Environment Variables

```typescript
// NEVER commit secrets to code

// ❌ NEVER
const API_KEY = 'sk_live_abc123';

// ✅ ALWAYS use environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Validate required secrets at startup
const REQUIRED_SECRETS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'CLOUDFLARE_R2_ACCESS_KEY',
];

for (const secret of REQUIRED_SECRETS) {
  if (!process.env[secret]) {
    throw new Error(`Missing required environment variable: ${secret}`);
  }
}
```

### Future Integration Credentials

When adding accounting integrations (Xero/QuickBooks):
- Use OAuth 2.0 flows, not API keys where possible
- Store refresh tokens encrypted
- Implement token refresh before expiry
- Log all API calls for audit

---

## Audit Logging

### What to Log

```typescript
const AUDIT_EVENTS = {
  // Authentication
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILURE: 'auth.login.failure',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_PASSWORD_CHANGE: 'auth.password.change',
  AUTH_PASSWORD_RESET: 'auth.password.reset',
  
  // Data access
  DATA_EXPORT: 'data.export',
  DATA_BULK_DELETE: 'data.bulk_delete',
  
  // Pricing changes
  PRICE_LIST_PUBLISHED: 'pricing.price_list.published',
  PRICING_RULE_CHANGED: 'pricing.rule.changed',
  
  // Orders
  ORDER_SUBMITTED_TO_ODOO: 'order.submitted',
  ORDER_APPROVED: 'order.approved',
  
  // Admin actions
  USER_CREATED: 'admin.user.created',
  USER_ROLE_CHANGED: 'admin.user.role_changed',
  USER_DEACTIVATED: 'admin.user.deactivated',
};
```

### Audit Log Structure

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  event: string;
  
  // Who
  userId: string;
  userEmail: string;
  userType: 'INTERNAL' | 'CUSTOMER';
  companyId?: string;
  
  // What
  resourceType: string;
  resourceId: string;
  action: string;
  
  // Context
  ipAddress: string;
  userAgent: string;
  
  // Changes
  previousValue?: any;
  newValue?: any;
  
  // Metadata
  metadata?: Record<string, any>;
}

async function logAuditEvent(event: AuditLog): Promise<void> {
  // Store in database
  await prisma.auditLog.create({ data: event });
  
  // Also send to external logging service for immutability
  await externalLogger.log(event);
}
```

---

## POPIA Compliance (South Africa)

### Key Requirements

1. **Consent**: Get explicit consent for data collection
2. **Purpose limitation**: Only use data for stated purposes
3. **Data minimization**: Only collect necessary data
4. **Retention limits**: Delete data when no longer needed
5. **Security**: Implement appropriate security measures
6. **Access rights**: Allow users to access/correct/delete their data

### Implementation

```typescript
// Consent tracking
model UserConsent {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  consentType String   @map("consent_type")  // 'marketing', 'analytics', etc.
  granted     Boolean
  grantedAt   DateTime @map("granted_at")
  ipAddress   String   @map("ip_address")
  
  @@map("user_consents")
}

// Data export endpoint
app.get('/api/v1/my-data', authenticate, async (req, res) => {
  const userId = req.user.id;
  
  const data = await gatherUserData(userId);
  
  // Log the export
  await logAuditEvent({
    event: 'DATA_EXPORT',
    userId,
    resourceType: 'user_data',
    resourceId: userId,
  });
  
  res.json({ data });
});

// Data deletion endpoint
app.delete('/api/v1/my-account', authenticate, async (req, res) => {
  const userId = req.user.id;
  
  // Soft delete user and anonymize data
  await anonymizeUserData(userId);
  
  await logAuditEvent({
    event: 'USER_DATA_DELETED',
    userId,
    resourceType: 'user',
    resourceId: userId,
  });
  
  res.json({ success: true });
});
```

---

## Security Checklist

### Authentication
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] Brute force protection
- [ ] Session timeout
- [ ] Secure cookie settings
- [ ] HTTPS everywhere

### Authorization
- [ ] Row-level security enforced
- [ ] Pricing visibility by role
- [ ] Company isolation for customers
- [ ] Permission checks on all endpoints

### Input/Output
- [ ] All input validated
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] Sensitive data masked in logs

### Infrastructure
- [ ] Secrets in environment variables
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Audit logging implemented

### Compliance
- [ ] POPIA consent mechanisms
- [ ] Data export capability
- [ ] Data deletion capability
- [ ] Retention policies defined
