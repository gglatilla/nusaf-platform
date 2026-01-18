import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    const body = await request.json();
    const reason = body.reason || null;

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

    // Update the account request status
    await prisma.accountRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // TODO: Send rejection email to applicant

    return NextResponse.json({
      success: true,
      message: "Account request rejected",
    });
  } catch (error) {
    console.error("Error rejecting account request:", error);
    return NextResponse.json(
      { error: "Failed to reject account request" },
      { status: 500 }
    );
  }
}
