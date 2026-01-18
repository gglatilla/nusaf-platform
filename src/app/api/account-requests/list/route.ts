import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const whereClause = status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {};

    const requests = await prisma.accountRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching account requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch account requests" },
      { status: 500 }
    );
  }
}
