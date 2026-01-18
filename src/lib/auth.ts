import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";
import { checkAndRecordDevice } from "./device-tracking";

// Session durations in seconds
const SESSION_DURATIONS = {
  normal: {
    maxAge: 8 * 60 * 60, // 8 hours absolute timeout
  },
  rememberMe: {
    maxAge: 30 * 24 * 60 * 60, // 30 days absolute timeout
  },
};

export type UserType = "staff" | "customer";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  userType: UserType;
  customerId?: string;
  mustChangePassword: boolean;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_DURATIONS.normal.maxAge,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = credentials.email.toLowerCase().trim();
        const rememberMe = credentials.rememberMe === "true";

        // Check rate limiting
        const isRateLimited = await checkRateLimit(email, req);
        if (isRateLimited) {
          throw new Error("ACCOUNT_LOCKED");
        }

        // Try to find staff user first
        const staffUser = await prisma.user.findUnique({
          where: { email },
        });

        if (staffUser) {
          return await authenticateStaffUser(
            staffUser,
            credentials.password,
            email,
            req
          );
        }

        // Try to find customer user
        const customerUser = await prisma.customerUser.findUnique({
          where: { email },
          include: {
            customer: true,
          },
        });

        if (customerUser) {
          return await authenticateCustomerUser(
            customerUser,
            credentials.password,
            email,
            req
          );
        }

        // Record failed attempt for non-existent user
        await recordLoginAttempt(email, req, false);
        throw new Error("Invalid email or password");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const authUser = user as unknown as AuthUser;
        token.id = authUser.id;
        token.email = authUser.email;
        token.name = authUser.name;
        token.role = authUser.role;
        token.userType = authUser.userType;
        token.customerId = authUser.customerId;
        token.mustChangePassword = authUser.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.userType = token.userType as UserType;
        session.user.customerId = token.customerId as string | undefined;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
};

async function authenticateStaffUser(
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    passwordHash: string;
    isActive: boolean;
    mustChangePassword: boolean;
  },
  password: string,
  email: string,
  req: any
): Promise<AuthUser> {
  if (!user.isActive) {
    await recordLoginAttempt(email, req, false);
    throw new Error("ACCOUNT_DISABLED");
  }

  const isPasswordValid = await compare(password, user.passwordHash);
  if (!isPasswordValid) {
    await recordLoginAttempt(email, req, false);
    throw new Error("Invalid email or password");
  }

  // Record successful login
  await recordLoginAttempt(email, req, true);

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Check and record device
  const ipAddress = getIpAddress(req);
  const userAgent = getUserAgent(req);
  const acceptLanguage = req?.headers?.["accept-language"];

  const deviceCheck = await checkAndRecordDevice(
    user.id,
    "staff",
    userAgent,
    acceptLanguage,
    ipAddress
  );

  if (deviceCheck.isNewDevice) {
    // TODO: Send new device alert email
    console.log(`New device login detected for staff user ${user.email}`);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    userType: "staff",
    mustChangePassword: user.mustChangePassword,
  };
}

async function authenticateCustomerUser(
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    passwordHash: string;
    isActive: boolean;
    mustChangePassword: boolean;
    customerId: string;
    customer: {
      isActive: boolean;
      isApproved: boolean;
    };
  },
  password: string,
  email: string,
  req: any
): Promise<AuthUser> {
  // Check if customer company is active and approved
  if (!user.customer.isApproved) {
    await recordLoginAttempt(email, req, false);
    throw new Error("ACCOUNT_PENDING");
  }

  if (!user.customer.isActive) {
    await recordLoginAttempt(email, req, false);
    throw new Error("COMPANY_INACTIVE");
  }

  if (!user.isActive) {
    await recordLoginAttempt(email, req, false);
    throw new Error("ACCOUNT_DISABLED");
  }

  const isPasswordValid = await compare(password, user.passwordHash);
  if (!isPasswordValid) {
    await recordLoginAttempt(email, req, false);
    throw new Error("Invalid email or password");
  }

  // Record successful login
  await recordLoginAttempt(email, req, true);

  // Update last login timestamp
  await prisma.customerUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Check and record device
  const ipAddress = getIpAddress(req);
  const userAgent = getUserAgent(req);
  const acceptLanguage = req?.headers?.["accept-language"];

  const deviceCheck = await checkAndRecordDevice(
    user.id,
    "customer",
    userAgent,
    acceptLanguage,
    ipAddress
  );

  if (deviceCheck.isNewDevice) {
    // TODO: Send new device alert email
    console.log(`New device login detected for customer user ${user.email}`);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    userType: "customer",
    customerId: user.customerId,
    mustChangePassword: user.mustChangePassword,
  };
}

async function checkRateLimit(email: string, req: any): Promise<boolean> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  // Count failed attempts in last 15 minutes
  const failedAttempts = await prisma.loginAttempt.count({
    where: {
      email,
      success: false,
      createdAt: { gte: fifteenMinutesAgo },
    },
  });

  // Lock after 10 failed attempts
  return failedAttempts >= 10;
}

async function recordLoginAttempt(
  email: string,
  req: any,
  success: boolean
): Promise<void> {
  const ipAddress = getIpAddress(req);
  const userAgent = getUserAgent(req);

  await prisma.loginAttempt.create({
    data: {
      email,
      ipAddress,
      userAgent,
      success,
    },
  });
}

function getIpAddress(req: any): string {
  // Try to get IP from various headers
  const forwarded = req?.headers?.["x-forwarded-for"];
  if (forwarded) {
    return Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(",")[0].trim();
  }
  return req?.headers?.["x-real-ip"] || req?.socket?.remoteAddress || "unknown";
}

function getUserAgent(req: any): string | undefined {
  return req?.headers?.["user-agent"];
}

// Helper to get the correct redirect URL based on user type
export function getRedirectUrl(userType: UserType): string {
  return userType === "staff" ? "/internal" : "/portal";
}

// Type augmentation for NextAuth
declare module "next-auth" {
  interface User extends AuthUser {}

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      userType: UserType;
      customerId?: string;
      mustChangePassword: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    userType: UserType;
    customerId?: string;
    mustChangePassword: boolean;
  }
}
