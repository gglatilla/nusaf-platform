import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password-validation";

// Generate a random temporary password
function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "staff") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin or sales role
    if (!["ADMIN", "SALES"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    // Find the account request
    const accountRequest = await prisma.accountRequest.findUnique({
      where: { id },
    });

    if (!accountRequest) {
      return NextResponse.json(
        { error: "Account request not found" },
        { status: 404 }
      );
    }

    if (accountRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    // Create customer and customer user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the customer
      const customer = await tx.customer.create({
        data: {
          companyName: accountRequest.companyName,
          contactName: accountRequest.contactName,
          email: accountRequest.email,
          phone: accountRequest.phone,
          vatNumber: accountRequest.vatNumber,
          isApproved: true,
          approvedBy: session.user.id,
          approvedAt: new Date(),
          createdFrom: "REGISTRATION",
          addresses: {
            create: {
              type: "BOTH",
              line1: accountRequest.address,
              city: accountRequest.city,
              postalCode: accountRequest.postalCode,
            },
          },
        },
      });

      // Create the customer user (admin role for first user)
      const customerUser = await tx.customerUser.create({
        data: {
          customerId: customer.id,
          email: accountRequest.email,
          name: accountRequest.contactName,
          passwordHash,
          role: "ADMIN",
          mustChangePassword: true,
        },
      });

      // Update the account request status
      await tx.accountRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
        },
      });

      return { customer, customerUser };
    });

    // TODO: Send welcome email with temporary credentials
    // For now, we'll return the temporary password in the response (for development)
    // In production, this should be sent via email only

    console.log(`Account approved for ${accountRequest.email}`);
    console.log(`Temporary password: ${temporaryPassword}`);

    return NextResponse.json({
      success: true,
      message: "Account request approved",
      customerId: result.customer.id,
      // In production, don't include the password in the response
      // This is only for development/testing
      temporaryPassword:
        process.env.NODE_ENV === "development" ? temporaryPassword : undefined,
    });
  } catch (error) {
    console.error("Error approving account request:", error);
    return NextResponse.json(
      { error: "Failed to approve account request" },
      { status: 500 }
    );
  }
}
