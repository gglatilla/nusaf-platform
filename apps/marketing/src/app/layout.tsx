import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
