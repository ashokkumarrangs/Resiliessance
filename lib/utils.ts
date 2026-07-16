import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number | string, includeSymbol = false) {
  const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericValue)) return '0';

  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(numericValue);

  return includeSymbol ? `₹${formatted}` : formatted;
}

export function formatCompactINR(val: number, includeSymbol = false) {
  // User requested no more K/L/Cr units, so we just return the full formatted number
  return formatINR(val, includeSymbol);
}
