import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// Hash the token for storage
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();

    if (!email) {
      // Return success even if email is missing to prevent enumeration
      return NextResponse.json({ success: true });
    }

    // Check if email exists in either User or CustomerUser table
    let userType: "staff" | "customer" | null = null;

    const staffUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    if (staffUser?.isActive) {
      userType = "staff";
    } else {
      const customerUser = await prisma.customerUser.findUnique({
        where: { email },
        include: {
          customer: { select: { isActive: true, isApproved: true } },
        },
      });

      if (
        customerUser?.isActive &&
        customerUser?.customer?.isActive &&
        customerUser?.customer?.isApproved
      ) {
        userType = "customer";
      }
    }

    // If user exists and is active, create reset token
    if (userType) {
      // Invalidate any existing tokens for this email
      await prisma.passwordResetToken.updateMany({
        where: {
          email,
          usedAt: null,
        },
        data: {
          usedAt: new Date(), // Mark as used
        },
      });

      // Generate new token
      const token = generateToken();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store hashed token
      await prisma.passwordResetToken.create({
        data: {
          tokenHash,
          email,
          userType,
          expiresAt,
        },
      });

      // TODO: Send email with reset link
      // The reset link would be: ${process.env.NEXTAUTH_URL}/reset-password?token=${token}
      const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;

      console.log(`Password reset requested for ${email}`);
      console.log(`Reset URL: ${resetUrl}`);

      // In production, send email here
      // await sendPasswordResetEmail(email, resetUrl);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in forgot password:", error);
    // Still return success to prevent information leakage
    return NextResponse.json({ success: true });
  }
}
