import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { validatePassword, hashPassword } from "@/lib/password-validation";

// Hash the token for comparison
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// GET: Verify token is valid
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const tokenHash = hashToken(token);

    // Find the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Check if token has been used
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "Token has already been used" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}

// POST: Reset password with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    // Find the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Check if token has been used
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "Token has already been used" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password and mark token as used in a transaction
    await prisma.$transaction(async (tx) => {
      // Mark token as used
      await tx.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      });

      // Update password based on user type
      if (resetToken.userType === "staff") {
        await tx.user.update({
          where: { email: resetToken.email },
          data: {
            passwordHash: newPasswordHash,
            mustChangePassword: false,
          },
        });
      } else {
        await tx.customerUser.update({
          where: { email: resetToken.email },
          data: {
            passwordHash: newPasswordHash,
            mustChangePassword: false,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
