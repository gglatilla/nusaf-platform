import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const isStaging = process.env.NEXT_PUBLIC_IS_STAGING === "true";

export const metadata: Metadata = {
  title: "NUSAF Dynamic Technologies | Industrial Components & Engineering",
  description:
    "Leading supplier of conveyor components, plastic table top chain, modular chain, gearboxes, and precision engineering solutions in South Africa.",
  keywords: [
    "conveyor components",
    "table top chain",
    "modular chain",
    "gearboxes",
    "industrial engineering",
    "South Africa",
  ],
  // Block indexing on staging
  robots: isStaging
    ? { index: false, follow: false, nocache: true }
    : { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
