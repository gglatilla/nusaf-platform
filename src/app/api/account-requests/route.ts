import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const accountRequestSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  vatNumber: z.string().optional(),
  industry: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Privacy Policy",
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = accountRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if there's already a pending request with this email
    const existingRequest = await prisma.accountRequest.findFirst({
      where: {
        email: data.email.toLowerCase(),
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "An account request with this email is already pending" },
        { status: 400 }
      );
    }

    // Check if there's already a customer or customer user with this email
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const existingCustomerUser = await prisma.customerUser.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingCustomerUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Create the account request
    const accountRequest = await prisma.accountRequest.create({
      data: {
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        vatNumber: data.vatNumber || null,
        industry: data.industry || null,
        consentGiven: data.consent,
        consentAt: new Date(),
      },
    });

    // TODO: Send notification email to admin about new account request

    return NextResponse.json(
      {
        success: true,
        message: "Account request submitted successfully",
        id: accountRequest.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating account request:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
