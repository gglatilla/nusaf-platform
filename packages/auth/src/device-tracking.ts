import { createHash } from "crypto";
import { prisma } from "@nusaf/database";

// Parse user agent to get device name
export function parseUserAgent(userAgent: string | undefined): string {
  if (!userAgent) return "Unknown Device";

  const ua = userAgent.toLowerCase();

  // Detect browser
  let browser = "Unknown Browser";
  if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("edg")) {
    browser = "Edge";
  } else if (ua.includes("chrome")) {
    browser = "Chrome";
  } else if (ua.includes("safari")) {
    browser = "Safari";
  } else if (ua.includes("opera") || ua.includes("opr")) {
    browser = "Opera";
  }

  // Detect OS
  let os = "Unknown OS";
  if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("mac os")) {
    os = "macOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS";
  }

  return `${browser} on ${os}`;
}

// Generate a device fingerprint hash
export function generateDeviceHash(
  userAgent: string | undefined,
  acceptLanguage: string | undefined
): string {
  // Combine available info to create a somewhat stable fingerprint
  // Note: This is not a perfect fingerprint, but good enough for alerting
  const fingerprint = `${userAgent || "unknown"}-${acceptLanguage || "unknown"}`;
  return createHash("sha256").update(fingerprint).digest("hex").substring(0, 32);
}

interface CheckDeviceResult {
  isNewDevice: boolean;
  deviceId: string | null;
}

// Check if device is known for a user
export async function checkAndRecordDevice(
  userId: string,
  userType: "staff" | "customer",
  userAgent: string | undefined,
  acceptLanguage: string | undefined,
  ipAddress: string
): Promise<CheckDeviceResult> {
  const deviceHash = generateDeviceHash(userAgent, acceptLanguage);
  const deviceName = parseUserAgent(userAgent);

  // Look for existing device
  const existingDevice = await prisma.knownDevice.findFirst({
    where:
      userType === "staff"
        ? { userId, deviceHash }
        : { customerUserId: userId, deviceHash },
  });

  if (existingDevice) {
    // Update last used timestamp
    await prisma.knownDevice.update({
      where: { id: existingDevice.id },
      data: {
        lastUsedAt: new Date(),
        ipAddress,
      },
    });

    return {
      isNewDevice: false,
      deviceId: existingDevice.id,
    };
  }

  // New device - record it
  const newDevice = await prisma.knownDevice.create({
    data:
      userType === "staff"
        ? {
            userId,
            deviceHash,
            deviceName,
            ipAddress,
          }
        : {
            customerUserId: userId,
            deviceHash,
            deviceName,
            ipAddress,
          },
  });

  return {
    isNewDevice: true,
    deviceId: newDevice.id,
  };
}

// Get user's known devices
export async function getUserDevices(
  userId: string,
  userType: "staff" | "customer"
) {
  const devices = await prisma.knownDevice.findMany({
    where:
      userType === "staff" ? { userId } : { customerUserId: userId },
    orderBy: { lastUsedAt: "desc" },
    select: {
      id: true,
      deviceName: true,
      ipAddress: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return devices;
}

// Format the new device alert email content
export function formatNewDeviceAlertEmail(
  userName: string,
  deviceName: string,
  ipAddress: string,
  loginTime: Date
): { subject: string; body: string } {
  const formattedTime = loginTime.toLocaleString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return {
    subject: "New Device Login - NUSAF Platform",
    body: `
Hi ${userName},

We noticed a new sign-in to your NUSAF account.

Device: ${deviceName}
IP Address: ${ipAddress}
Time: ${formattedTime}

If this was you, you can ignore this email.

If you didn't sign in from this device, please:
1. Change your password immediately at ${process.env.NEXTAUTH_URL || "https://nusaf.co.za"}/change-password
2. Contact our support team if you need assistance

Best regards,
NUSAF Dynamic Technologies
    `.trim(),
  };
}
