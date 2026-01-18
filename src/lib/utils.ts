import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "ZAR"): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function generateQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `Q${year}${month}-${random}`;
}

export function generateJobNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `J${year}-${random}`;
}

// Convert Tecom SKU to Nusaf SKU
// Tecom: C + part# (4 digits) + identifier (5 digits) e.g., C020080271
// Nusaf: 1 + part# (no leading zeros) + dash + identifier e.g., 1200-80271
export function tecomToNusafSku(tecomSku: string): string | null {
  const match = tecomSku.match(/^C(\d{4})(\d{5})$/);
  if (!match) return null;

  const partNumber = parseInt(match[1], 10); // Remove leading zeros
  const identifier = match[2];

  return `1${partNumber}-${identifier}`;
}

// Convert Nusaf SKU back to Tecom SKU
export function nusafToTecomSku(nusafSku: string): string | null {
  const match = nusafSku.match(/^1(\d+)-(\d{5})$/);
  if (!match) return null;

  const partNumber = match[1].padStart(4, "0");
  const identifier = match[2];

  return `C${partNumber}${identifier}`;
}
