# Current Work in Progress

> **This file captures the EXACT state of active work so Claude can resume without losing any context.**
> Update this file frequently during work, and always before ending a session.

---

## Status

**IDLE** - Login System Revision complete. Ready for Phase 2 (Marketing Website).

---

## Active Task

None currently.

---

## What We're Working On

Login System Revision is **COMPLETE**. The platform now has:
- Unified login page for both staff and customers
- Password visibility toggle and Remember Me functionality
- Forgot password / Reset password flow
- Customer account request and admin approval queue
- Force password change on first login
- Rate limiting and login security
- Session timeout with warning
- New device notifications
- Cookie consent banner (POPIA compliance)
- Comprehensive login behavior tests (9 tests passing)

---

## Current State

### Last Completed Work
- **Task:** Implement Login System Revision (from plan)
- **Completed:** 2026-01-18
- **What was done:**
  - Redesigned login page as unified Sign In for staff + customers
  - Created PasswordInput component with visibility toggle
  - Added Checkbox component for Remember Me
  - Rewrote auth.ts to support dual user types (staff Users + CustomerUsers)
  - Implemented role-based routing (staff→/internal, customers→/portal)
  - Created request account page and API for customer registration
  - Created admin approval queue at /internal/account-requests
  - Created forgot password and reset password flows
  - Created change password page for first login
  - Implemented rate limiting with LoginAttempt tracking
  - Added device tracking for new device alerts
  - Created session timeout warning component
  - Created cookie consent banner
  - Created privacy policy page
  - Created password validation utility
  - Added 6 new database models (CustomerUser, PasswordResetToken, AccountRequest, LoginAttempt, KnownDevice, CustomerUserRole enum)
  - Set up Jest + React Testing Library with 9 login behavior tests

### Files Modified/Created in This Session
| File | What Changed |
|------|--------------|
| `prisma/schema.prisma` | Added 6 new models for login system |
| `src/app/login/page.tsx` | Completely redesigned unified login |
| `src/lib/auth.ts` | Rewrote for dual user type support |
| `src/lib/password-validation.ts` | New - password strength checker |
| `src/lib/device-tracking.ts` | New - device fingerprinting |
| `src/components/ui/password-input.tsx` | New - password with toggle |
| `src/components/ui/checkbox.tsx` | New - remember me checkbox |
| `src/components/session-timeout-warning.tsx` | New - timeout modal |
| `src/components/cookie-consent.tsx` | New - POPIA banner |
| `src/app/request-account/page.tsx` | New - customer registration |
| `src/app/forgot-password/page.tsx` | New - forgot password |
| `src/app/reset-password/page.tsx` | New - reset password |
| `src/app/change-password/page.tsx` | New - force change |
| `src/app/privacy-policy/page.tsx` | New - privacy policy |
| `src/app/(internal)/internal/account-requests/page.tsx` | New - admin queue |
| `src/app/api/account-requests/**` | New - account request APIs |
| `src/app/api/auth/forgot-password/route.ts` | New - forgot password API |
| `src/app/api/auth/reset-password/route.ts` | New - reset password API |
| `src/app/api/auth/change-password/route.ts` | New - change password API |
| `jest.config.js`, `jest.setup.js` | New - test configuration |
| `src/__tests__/auth/login.test.tsx` | New - 9 login behavior tests |
| `package.json` | Added Jest + Testing Library deps |

---

## Context & Decisions Made

### Login System Decisions
| Decision | Reasoning |
|----------|-----------|
| Dual user model (User + CustomerUser) | Staff and customers have different needs, separate tables cleaner |
| JWT sessions | Continue using JWT, consistent with Phase 1 |
| Rate limiting in LoginAttempt table | Simple to implement, works without Redis |
| Device fingerprinting via hash | Lightweight, no third-party service needed |
| Password strength via custom validator | No external dependency, block top 10k common passwords |

### Phase 1 Decisions
| Decision | Reasoning |
|----------|-----------|
| Prisma v5 over v7 | v7 has breaking changes, v5 is more stable for current needs |
| Tailwind CSS v3 over v4 | Better compatibility with Next.js 14 PostCSS setup |
| shadcn/ui style components | Built manually for flexibility, no external dependency |
| JWT sessions over database sessions | Simpler setup, works well for staff auth |
| Single pricing calculator class | Clean separation, easy to test and maintain |

---

## Problems & Debugging

### Fixed: Login Redirect Bug
- **Problem:** After login, users were redirected to "/" instead of /internal or /portal
- **Cause:** Login page wasn't using user type from session to determine redirect
- **Fix:** Updated handleSubmit to call getRedirectUrl(session.user.userType)
- **Prevention:** Added 9 behavior tests to catch routing logic errors

No active problems. Build passes successfully. All 9 tests passing.

---

## Immediate Next Steps

**Phase 2: Marketing Website + Public Quoting**

1. Build public marketing website pages (About, Industries, Capabilities, Contact)
2. Create public product catalog (no prices shown)
3. Implement quote basket functionality
4. Build quote request form (lead capture)
5. Create salesperson review queue
6. Generate PDF quotes

---

## Files Claude Should Review When Resuming

### Always Read (part of `nusaf start`)
- `CLAUDE.md` - Commands and rules
- `CURRENT-WORK.md` - This file
- Latest `docs/sessions/*.md`
- `CODEBASE-OVERVIEW.md`

### For Phase 2 Development
- `src/app/(internal)/internal/pricing/page.tsx` - Reference for pricing UI
- `src/lib/pricing/calculator.ts` - Pricing engine for quote calculations
- `prisma/schema.prisma` - Database schema for quotes

### For Login System Reference
- `src/lib/auth.ts` - Auth configuration with dual user support
- `src/__tests__/auth/login.test.tsx` - Login behavior tests

---

## Code Snippets / Implementation Notes

### Role-Based Routing
```typescript
// In src/lib/auth.ts
export function getRedirectUrl(userType: UserType): string {
  return userType === "staff" ? "/internal" : "/portal";
}

// In login page handleSubmit:
const session = await updateSession();
if (session?.user?.mustChangePassword) {
  router.push("/change-password");
} else if (callbackUrl) {
  router.push(callbackUrl);
} else {
  router.push(getRedirectUrl(session?.user?.userType || "customer"));
}
```

### Default Login Credentials (from seed)
- Admin: admin@nusaf.co.za / admin123
- Sales: sales@nusaf.co.za / sales123

---

## Questions to Resolve

None currently.

---

## Reminders for Next Session

- Run `npx prisma db push` then `npm run db:seed` to set up database
- Run `npm run dev` to start development server
- Build passes with `npm run build`
- Run `npm test` to run all tests (9 tests passing)

---

*Last updated: 2026-01-18*
*Status: IDLE - Login System Revision complete*
